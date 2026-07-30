// auth.js — OTP generation/verification, JWT issue/verify, role middleware.
const jwt = require('jsonwebtoken');
const { query, mapUser } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const OTP_TTL = (parseInt(process.env.OTP_TTL_SECONDS, 10) || 300) * 1000;

const adminSet = new Set(
  (process.env.ADMIN_MOBILES || '')
    .split(',').map((s) => s.trim()).filter(Boolean)
);

const isValidMobile = (m) => /^\d{10}$/.test(m || '');

async function nextCustomerId() {
  const { rows } = await query(
    `SELECT customer_id FROM users WHERE customer_id IS NOT NULL
     ORDER BY customer_id DESC LIMIT 1`
  );
  const n = rows[0] ? parseInt(rows[0].customer_id.replace('CUS', ''), 10) + 1 : 1;
  return 'CUS' + String(n).padStart(4, '0');
}

// ─── OTP ────────────────────────────────────────────────────────────────────
async function sendOtp(mobile) {
  const code = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit
  await query(
    `INSERT INTO otps (mobile, code, expires_at, attempts)
     VALUES ($1, $2, $3, 0)
     ON CONFLICT (mobile) DO UPDATE SET code = EXCLUDED.code,
       expires_at = EXCLUDED.expires_at, attempts = 0`,
    [mobile, code, Date.now() + OTP_TTL]
  );

  const provider = (process.env.OTP_PROVIDER || '').toLowerCase();

  if (provider === 'msg91') {
    await fetch('https://control.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authkey: process.env.MSG91_AUTHKEY },
      body: JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_ID,
        mobile: '91' + mobile, otp: code,
      }),
    });
    return { sent: true };
  }
  if (provider === 'twilio') {
    // Twilio Verify sends & tracks the code itself — we still store ours as a fallback.
    const sid = process.env.TWILIO_ACCOUNT_SID, tok = process.env.TWILIO_AUTH_TOKEN;
    const svc = process.env.TWILIO_VERIFY_SERVICE_SID;
    await fetch(`https://verify.twilio.com/v2/Services/${svc}/Verifications`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${sid}:${tok}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: '+91' + mobile, Channel: 'sms' }),
    });
    return { sent: true };
  }
  // firebase: OTP is handled entirely on the client SDK; backend only verifies
  // the resulting Firebase ID token (see POST /auth/firebase below).

  // DEV mode — no provider configured.
  console.log(`[OTP] ${mobile} -> ${code} (dev mode, not really sent)`);
  return { sent: true, devCode: code };
}

async function verifyOtp(mobile, code) {
  const { rows } = await query('SELECT * FROM otps WHERE mobile = $1', [mobile]);
  const row = rows[0];
  if (!row) return { ok: false, error: 'Request an OTP first.' };
  if (row.attempts >= 5) return { ok: false, error: 'Too many attempts. Request a new code.' };
  if (Date.now() > Number(row.expires_at)) return { ok: false, error: 'Code expired. Request a new one.' };
  if (String(code) !== row.code) {
    await query('UPDATE otps SET attempts = attempts + 1 WHERE mobile = $1', [mobile]);
    return { ok: false, error: 'Incorrect code.' };
  }
  await query('DELETE FROM otps WHERE mobile = $1', [mobile]);
  return { ok: true };
}

// ─── Users ────────────────────────────────────────────────────────────────
async function findOrCreateUser(mobile) {
  let { rows } = await query('SELECT * FROM users WHERE mobile = $1', [mobile]);
  let u = rows[0];
  const role = adminSet.has(mobile) ? 'admin' : 'user';
  const now = new Date().toISOString();
  if (!u) {
    const customerId = role === 'admin' ? null : await nextCustomerId();
    const ins = await query(
      `INSERT INTO users (mobile, customer_id, role, profile_done, created_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [mobile, customerId, role, role === 'admin', now]
    );
    u = ins.rows[0];
  } else if (u.role !== role) {
    // keep role in sync if the allowlist changed
    await query('UPDATE users SET role = $1 WHERE id = $2', [role, u.id]);
    u.role = role;
  }
  return u;
}

function issueToken(user) {
  return jwt.sign(
    { sub: user.id, mobile: user.mobile, role: user.role },
    JWT_SECRET, { expiresIn: '30d' }
  );
}

// ─── Middleware ─────────────────────────────────────────────────────────────
async function authRequired(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [payload.sub]);
    const u = rows[0];
    if (!u) return res.status(401).json({ error: 'User not found' });
    req.user = u;              // raw row
    req.userApi = mapUser(u);  // api shape
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function adminRequired(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

module.exports = {
  sendOtp, verifyOtp, findOrCreateUser, issueToken,
  authRequired, adminRequired, isValidMobile,
};
