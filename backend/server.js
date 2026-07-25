// server.js — Express app wiring every feature the Roti & More app uses.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { query, initSchema, mapProduct, mapOrder, mapUser, mapNotif } = require('./db');
const {
  sendOtp, verifyOtp, findOrCreateUser, issueToken,
  authRequired, adminRequired, isValidMobile,
} = require('./auth');

const app = express();
app.set('trust proxy', 1); // Render/most hosts sit behind a proxy — needed for rate-limit to see the real client IP
app.use(helmet());
// Lock CORS to your frontend origin in production (comma-separated allowed).
// Leave CORS_ORIGIN unset to allow all (dev only).
const origins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors(origins.length ? { origin: origins } : {}));
app.use(express.json({ limit: '6mb' })); // base64 product images

// OTP request/verify are the only unauthenticated, abusable-at-scale routes
// (SMS cost per request, brute-forceable 4-digit code) — cap both per IP.
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

const today = () => new Date().toISOString().split('T')[0];
const nowIso = () => new Date().toISOString();

// Wrap async route handlers so rejected promises reach the error middleware
// instead of crashing the process or hanging the request.
const h = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ─── Notification helper ─────────────────────────────────────────────────────
// Writes the in-app notification row (source of truth, always works) and,
// best-effort, pushes it via FCM to whichever device tokens the audience has
// registered. userId 0 means "all admins" — resolved to their tokens here.
async function notify(userId, message) {
  await query(
    `INSERT INTO notifications (user_id, message, read, created_date, created_at)
     VALUES ($1, $2, false, $3, $4)`,
    [userId, message, today(), nowIso()]
  );
  await pushToUser(userId, message);
}

async function pushToUser(userId, message) {
  try {
    const { rows } = userId === 0
      ? await query(
          `SELECT pt.token FROM push_tokens pt
           JOIN users u ON u.id = pt.user_id WHERE u.role='admin'`
        )
      : await query('SELECT token FROM push_tokens WHERE user_id=$1', [userId]);
    if (!rows.length) return;
    const tokens = rows.map((r) => r.token);
    const { sendPush } = require('./firebase');
    const { deadTokens } = await sendPush(tokens, {
      title: 'Roti & More',
      body: message,
      data: { userId: String(userId) },
    });
    for (const t of deadTokens) {
      await query('DELETE FROM push_tokens WHERE token=$1', [t]);
    }
  } catch (e) {
    console.error('pushToUser failed:', e.message); // never let push errors break the request
  }
}

async function getOrder(id) {
  const { rows } = await query('SELECT * FROM orders WHERE id=$1', [id]);
  return rows[0];
}
async function getProduct(id) {
  const { rows } = await query('SELECT * FROM products WHERE id=$1', [id]);
  return rows[0];
}
async function getUser(id) {
  const { rows } = await query('SELECT * FROM users WHERE id=$1', [id]);
  return rows[0];
}

// ══════════════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════════════
app.post('/auth/request-otp', otpLimiter, h(async (req, res) => {
  const { mobile } = req.body;
  if (!isValidMobile(mobile)) return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });
  const result = await sendOtp(mobile);
  res.json(result); // { sent:true, devCode? }
}));

app.post('/auth/verify-otp', otpLimiter, h(async (req, res) => {
  const { mobile, code } = req.body;
  if (!isValidMobile(mobile)) return res.status(400).json({ error: 'Invalid mobile.' });
  const v = await verifyOtp(mobile, code);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const user = await findOrCreateUser(mobile);
  const token = issueToken(user);
  res.json({
    token,
    role: user.role,
    profileComplete: !!user.profile_done,
    user: mapUser(user),
  });
}));

// Firebase Phone Auth: client verifies the OTP with the Firebase SDK, then posts
// the resulting ID token here. We verify it, map the phone to a user, apply the
// same admin allowlist, and issue our own JWT.
app.post('/auth/firebase', otpLimiter, h(async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'Missing idToken.' });
    const { verifyFirebaseToken } = require('./firebase');
    const e164 = await verifyFirebaseToken(idToken);       // +919876543210
    const mobile = e164.replace(/^\+91/, '').replace(/^\+/, '');
    if (!isValidMobile(mobile)) return res.status(400).json({ error: 'Unsupported phone number.' });
    const user = await findOrCreateUser(mobile);
    res.json({
      token: issueToken(user), role: user.role,
      profileComplete: !!user.profile_done, user: mapUser(user),
    });
  } catch (e) {
    res.status(401).json({ error: e.message || 'Firebase verification failed.' });
  }
}));

// ══════════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS (FCM device token registration)
// ══════════════════════════════════════════════════════════════════════════
// A token belongs to whichever user last registered it (ON CONFLICT reassigns
// it) — covers logout/login as a different account on the same device.
app.post('/me/push-token', authRequired, h(async (req, res) => {
  const { token, platform } = req.body;
  if (!token) return res.status(400).json({ error: 'Missing token.' });
  await query(
    `INSERT INTO push_tokens (token, user_id, platform, created_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, platform = EXCLUDED.platform`,
    [token, req.user.id, platform || 'android', nowIso()]
  );
  res.json({ ok: true });
}));

app.delete('/me/push-token', authRequired, h(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Missing token.' });
  await query('DELETE FROM push_tokens WHERE token=$1 AND user_id=$2', [token, req.user.id]);
  res.json({ ok: true });
}));

// ══════════════════════════════════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════════════════════════════════
app.get('/me', authRequired, (req, res) => res.json(req.userApi));

app.put('/me/profile', authRequired, h(async (req, res) => {
  const { name, cateringName, address } = req.body;
  if (!name?.trim() || !address?.trim())
    return res.status(400).json({ error: 'Name and address are required.' });
  await query(
    `UPDATE users SET name=$1, catering_name=$2, address=$3, profile_done=true WHERE id=$4`,
    [name.trim(), (cateringName || '').trim() || null, address.trim(), req.user.id]
  );
  res.json(mapUser(await getUser(req.user.id)));
}));

// ══════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════════════════════════════════════
app.get('/products', h(async (req, res) => {
  const { rows } = await query('SELECT * FROM products ORDER BY id');
  res.json(rows.map(mapProduct));
}));

// Broadcasts a message to every customer — in-app alert + push, same as
// notify(), just addressed to all customers instead of one user/admin.
// Returns how many customers it went to.
async function notifyAllCustomers(message) {
  const { rows: customers } = await query("SELECT id FROM users WHERE role='user'");
  for (const c of customers) {
    await notify(c.id, message);
  }
  return customers.length;
}

app.post('/products', authRequired, adminRequired, h(async (req, res) => {
  const { name, price, description, category, status, imageUrl } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'Name and price required.' });
  const { rows } = await query(
    `INSERT INTO products (name, price, description, category, status, image_url)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, Number(price), description || '', category || 'Flatbreads',
     status || 'available', imageUrl || null]
  );
  await notifyAllCustomers(`🆕 New on the menu: ${name} — ₹${Number(price)}`);
  res.status(201).json(mapProduct(rows[0]));
}));

app.put('/products/:id', authRequired, adminRequired, h(async (req, res) => {
  const p = await getProduct(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const { name, price, description, category, status, imageUrl } = req.body;
  const newPrice = price != null ? Number(price) : p.price;
  const newStatus = status ?? p.status;
  const { rows } = await query(
    `UPDATE products SET name=$1, price=$2, description=$3, category=$4, status=$5, image_url=$6
     WHERE id=$7 RETURNING *`,
    [name ?? p.name, newPrice, description ?? p.description, category ?? p.category,
     newStatus, imageUrl !== undefined ? imageUrl : p.image_url, p.id]
  );

  // Only tell customers about changes that actually affect them — price and
  // availability — not every edit (e.g. a description tweak).
  const label = name ?? p.name;
  if (newPrice !== p.price) {
    await notifyAllCustomers(`💰 Price update: ${label} is now ₹${newPrice}`);
  }
  if (newStatus !== p.status) {
    await notifyAllCustomers(
      newStatus === 'available' ? `✅ ${label} is back in stock!` : `⚠️ ${label} is currently out of stock.`
    );
  }

  res.json(mapProduct(rows[0]));
}));

app.delete('/products/:id', authRequired, adminRequired, h(async (req, res) => {
  await query('DELETE FROM products WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
}));

// ══════════════════════════════════════════════════════════════════════════
// ORDERS
// ══════════════════════════════════════════════════════════════════════════
const canCancel = (o) =>
  o.status === 'pending' && (Date.now() - new Date(o.created_at).getTime()) < 6 * 3600 * 1000;

// Admin's default ("all") order list: pending work surfaces first regardless
// of age, so nothing gets missed — newest first within each stage after that.
const STATUS_PRIORITY_SQL = `CASE status
  WHEN 'pending' THEN 0
  WHEN 'approved' THEN 1
  WHEN 'preparing' THEN 2
  WHEN 'ready' THEN 3
  WHEN 'out_for_delivery' THEN 4
  WHEN 'completed' THEN 5
  WHEN 'rejected' THEN 6
  WHEN 'cancelled' THEN 7
  ELSE 8 END`;

// list — users see their own, admin sees all (optional ?status= filter)
app.get('/orders', authRequired, h(async (req, res) => {
  const { status } = req.query;
  let rows;
  if (req.user.role === 'admin') {
    ({ rows } = status && status !== 'all'
      ? await query('SELECT * FROM orders WHERE status=$1 ORDER BY id DESC', [status])
      : await query(`SELECT * FROM orders ORDER BY ${STATUS_PRIORITY_SQL}, id DESC`));
  } else {
    ({ rows } = await query('SELECT * FROM orders WHERE user_id=$1 ORDER BY id DESC', [req.user.id]));
  }
  res.json(rows.map(mapOrder));
}));

app.get('/orders/:id', authRequired, h(async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && o.user_id !== req.user.id)
    return res.status(403).json({ error: 'Forbidden' });
  res.json(mapOrder(o));
}));

// place order (user)
app.post('/orders', authRequired, h(async (req, res) => {
  const u = req.user;
  if (!u.profile_done) return res.status(400).json({ error: 'Complete your profile first.' });
  const { items, deliveryDate, deliveryTime, remarks } = req.body;
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'Cart is empty.' });
  if (!deliveryDate || !deliveryTime)
    return res.status(400).json({ error: 'Select delivery date and time.' });

  // recompute totals server-side from live product prices (never trust client)
  const norm = [];
  for (const it of items) {
    const p = await getProduct(it.productId);
    if (!p) return res.status(400).json({ error: 'Unknown product ' + it.productId });
    norm.push({ productId: p.id, name: p.name, price: p.price, quantity: Math.max(1, +it.quantity) });
  }
  const subtotal = norm.reduce((s, i) => s + i.price * i.quantity, 0);
  const displayName = u.catering_name || u.name;

  // Order ids are 4-digit random numbers (bill-friendly), not auto-increment,
  // so collisions are expected as order volume grows — retry with a fresh id
  // rather than 500ing on the (fairly common, birthday-paradox) unique clash.
  let id;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    id = Math.floor(1000 + Math.random() * 9000);
    try {
      await query(
        `INSERT INTO orders (id,user_id,customer_name,customer_mobile,customer_address,
           items_json,subtotal,gst,delivery,total,status,created_date,created_at,
           delivery_date,delivery_time,remarks,contact_person,paid_amount,payments_json,
           address_edit_used,reschedule_used)
         VALUES ($1,$2,$3,$4,$5,$6,$7,0,0,$8,'pending',$9,$10,$11,$12,$13,$14,0,'[]',false,false)`,
        [id, u.id, displayName, u.mobile, u.address, JSON.stringify(norm),
         subtotal, subtotal, today(), nowIso(), deliveryDate, deliveryTime,
         remarks || null, u.name]
      );
      break;
    } catch (e) {
      if (e.code === '23505' && attempt < 9) continue; // unique_violation — try another id
      throw e;
    }
  }

  await notify(0, `New Order #${id} from ${displayName} (${u.mobile}) — ₹${subtotal} | Delivery: ${deliveryDate} at ${deliveryTime}`);
  res.status(201).json(mapOrder(await getOrder(id)));
}));

// accept (admin)
app.post('/orders/:id/accept', authRequired, adminRequired, h(async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  if (o.status !== 'pending') return res.status(400).json({ error: 'Only pending orders can be accepted.' });
  await query("UPDATE orders SET status='approved' WHERE id=$1", [o.id]);
  await notify(o.user_id, `🟢 Order #${o.id} accepted! Delivery: ${o.delivery_date} at ${o.delivery_time}. Total: ₹${o.total}`);
  res.json(mapOrder(await getOrder(o.id)));
}));

// reject (admin)
app.post('/orders/:id/reject', authRequired, adminRequired, h(async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  await query("UPDATE orders SET status='rejected' WHERE id=$1", [o.id]);
  await notify(o.user_id, `🔴 Order #${o.id} could not be accepted. Please contact us.`);
  res.json(mapOrder(await getOrder(o.id)));
}));

// Kitchen pipeline (admin): approved -> preparing -> ready -> out_for_delivery -> completed.
// Each step only allowed from its natural predecessor so the UI can't skip a
// stage by accident; `deliver` below stays permissive (works from any
// non-terminal status) as an escape hatch, matching its existing behavior.
const PIPELINE_STEPS = {
  prepare: { from: 'approved', to: 'preparing', label: 'preparing' },
  ready: { from: 'preparing', to: 'ready', label: 'ready for delivery' },
  'out-for-delivery': { from: 'ready', to: 'out_for_delivery', label: 'out for delivery' },
};
for (const [path, step] of Object.entries(PIPELINE_STEPS)) {
  app.post(`/orders/:id/${path}`, authRequired, adminRequired, h(async (req, res) => {
    const o = await getOrder(req.params.id);
    if (!o) return res.status(404).json({ error: 'Not found' });
    if (o.status !== step.from) {
      return res.status(400).json({ error: `Order must be "${step.from}" to mark it ${step.label}.` });
    }
    await query('UPDATE orders SET status=$1 WHERE id=$2', [step.to, o.id]);
    await notify(o.user_id, `👨‍🍳 Order #${o.id} is now ${step.label}.`);
    res.json(mapOrder(await getOrder(o.id)));
  }));
}

// mark delivered (admin) — permissive on purpose: always available as a
// manual override regardless of which pipeline step the order is on.
app.post('/orders/:id/deliver', authRequired, adminRequired, h(async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  await query("UPDATE orders SET status='completed' WHERE id=$1", [o.id]);
  await notify(o.user_id, `📦 Order #${o.id} delivered.`);
  res.json(mapOrder(await getOrder(o.id)));
}));

// cancel (user, within 6h & pending)
app.post('/orders/:id/cancel', authRequired, h(async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  if (o.user_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });
  if (!canCancel(o)) return res.status(400).json({ error: 'Cancellation window has closed (6 hours, pending only).' });
  await query("UPDATE orders SET status='cancelled' WHERE id=$1", [o.id]);
  await notify(0, `🚫 Order #${o.id} was cancelled by customer.`);
  res.json(mapOrder(await getOrder(o.id)));
}));

// reschedule (user once, or admin any time)
app.post('/orders/:id/reschedule', authRequired, h(async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  const { deliveryDate, deliveryTime } = req.body;
  if (!deliveryDate || !deliveryTime) return res.status(400).json({ error: 'Date and time required.' });
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin) {
    if (o.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (o.reschedule_used) return res.status(400).json({ error: 'You can reschedule an order only once.' });
  }
  await query(
    `UPDATE orders SET delivery_date=$1, delivery_time=$2, reschedule_used=$3 WHERE id=$4`,
    [deliveryDate, deliveryTime, isAdmin ? o.reschedule_used : true, o.id]
  );
  await notify(isAdmin ? o.user_id : 0,
    `${isAdmin ? '⏰ Delivery rescheduled for' : '📅 Customer rescheduled'} #${o.id}: ${deliveryDate} at ${deliveryTime}`);
  res.json(mapOrder(await getOrder(o.id)));
}));

// edit delivery address (user, once)
app.put('/orders/:id/address', authRequired, h(async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  if (o.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (o.address_edit_used) return res.status(400).json({ error: 'Address can be edited only once.' });
  const { address } = req.body;
  if (!address?.trim()) return res.status(400).json({ error: 'Address required.' });
  await query('UPDATE orders SET customer_address=$1, address_edit_used=true WHERE id=$2', [address.trim(), o.id]);
  await notify(0, `📍 Customer updated delivery address for Order #${o.id}: ${address.trim()}`);
  res.json(mapOrder(await getOrder(o.id)));
}));

// record payment (admin)
app.post('/orders/:id/payments', authRequired, adminRequired, h(async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  const { amount, note, mode, transactionId } = req.body;
  const amt = Number(amount);
  const remaining = o.total - o.paid_amount;
  if (!amt || amt <= 0) return res.status(400).json({ error: 'Enter a valid amount.' });
  if (amt > remaining) return res.status(400).json({ error: `Amount exceeds remaining balance (₹${remaining}).` });

  const payments = JSON.parse(o.payments_json);
  payments.push({ amount: amt, date: today(), note: note || 'Payment received',
                  mode: mode || 'Cash', transactionId: transactionId || '' });
  const newPaid = o.paid_amount + amt;
  const newBal = o.total - newPaid;
  const newStatus = newBal <= 0 ? 'completed' : o.status;
  await query('UPDATE orders SET paid_amount=$1, payments_json=$2, status=$3 WHERE id=$4',
    [newPaid, JSON.stringify(payments), newStatus, o.id]);
  await notify(o.user_id, newBal <= 0
    ? `✅ Order #${o.id} fully paid. Thank you!`
    : `💰 Payment of ₹${amt} for order #${o.id}. Balance: ₹${newBal}`);
  res.json(mapOrder(await getOrder(o.id)));
}));

// bill data (either party on their order)
app.get('/orders/:id/bill', authRequired, h(async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && o.user_id !== req.user.id)
    return res.status(403).json({ error: 'Forbidden' });
  const cust = await getUser(o.user_id);
  const order = mapOrder(o);
  res.json({
    billNo: 'BILL' + o.id,
    order,
    customer: { name: o.customer_name, customerId: cust?.customer_id, mobile: o.customer_mobile },
    balance: Math.max(0, o.total - o.paid_amount),
  });
}));

// ══════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════
// "In progress" = accepted but not yet delivered/rejected/cancelled.
const IN_PROGRESS_STATUSES = ['approved', 'preparing', 'ready', 'out_for_delivery'];
// Orders that were never fulfilled — excluded from every money/production total.
const NOT_BILLABLE_STATUSES = ['rejected', 'cancelled'];
const billableOrders = (orders) => orders.filter((o) => !NOT_BILLABLE_STATUSES.includes(o.status));

// Production summary for a single day: order counts by stage, plus
// per-product ordered/completed/remaining quantities — scoped to orders
// *placed* on that day (not orders delivered that day), matching a
// same-day/pre-order catering workflow. Defaults to today; pass ?date=
// (YYYY-MM-DD) to view any other day's production instead.
// Also includes all-time totals (orders placed and revenue billed since the
// app went live), separate from the single-day figures above.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
app.get('/admin/dashboard', authRequired, adminRequired, h(async (req, res) => {
  const date = DATE_RE.test(req.query.date || '') ? req.query.date : today();
  const { rows } = await query('SELECT * FROM orders WHERE created_date=$1', [date]);
  const orders = rows.map(mapOrder);

  const productStats = new Map(); // productId -> { productId, name, orderedQty, completedQty }
  for (const o of billableOrders(orders)) {
    for (const item of o.items) {
      const entry = productStats.get(item.productId) ||
        { productId: item.productId, name: item.name, orderedQty: 0, completedQty: 0 };
      entry.orderedQty += item.quantity;
      if (o.status === 'completed') entry.completedQty += item.quantity;
      productStats.set(item.productId, entry);
    }
  }
  const products = [...productStats.values()]
    .map((p) => ({ ...p, remainingQty: p.orderedQty - p.completedQty }))
    .sort((a, b) => b.orderedQty - a.orderedQty);

  const { rows: allRows } = await query('SELECT * FROM orders');
  const allOrders = allRows.map(mapOrder);
  const totalRevenueAllTime = billableOrders(allOrders).reduce((s, o) => s + o.total, 0);

  res.json({
    date,
    totalToday: orders.length,
    pendingToday: orders.filter((o) => o.status === 'pending').length,
    acceptedToday: orders.filter((o) => IN_PROGRESS_STATUSES.includes(o.status)).length,
    completedToday: orders.filter((o) => o.status === 'completed').length,
    products,
    totalOrdersAllTime: allOrders.length,
    totalRevenueAllTime,
  });
}));

// ══════════════════════════════════════════════════════════════════════════
// CUSTOMER DASHBOARD
// ══════════════════════════════════════════════════════════════════════════
// Lifetime summary for the signed-in customer. Rejected/cancelled orders are
// excluded from the money and item totals — they were never fulfilled, so
// counting them would overstate what the customer actually ordered/owes.
app.get('/me/dashboard', authRequired, h(async (req, res) => {
  const { rows } = await query('SELECT * FROM orders WHERE user_id=$1', [req.user.id]);
  const allOrders = rows.map(mapOrder);
  const orders = billableOrders(allOrders);

  const productIds = new Set();
  let totalQuantity = 0;
  for (const o of orders) {
    for (const item of o.items) {
      productIds.add(item.productId);
      totalQuantity += item.quantity;
    }
  }
  const totalBillAmount = orders.reduce((s, o) => s + o.total, 0);
  const totalPaid = orders.reduce((s, o) => s + o.paidAmount, 0);

  res.json({
    totalOrders: allOrders.length,
    totalItemsOrdered: productIds.size,
    totalQuantityOrdered: totalQuantity,
    totalBillAmount,
    outstanding: Math.max(0, totalBillAmount - totalPaid),
  });
}));

// ══════════════════════════════════════════════════════════════════════════
// CUSTOMERS (admin)
// ══════════════════════════════════════════════════════════════════════════
app.get('/customers', authRequired, adminRequired, h(async (req, res) => {
  const { rows: users } = await query("SELECT * FROM users WHERE role='user'");
  const q = (req.query.q || '').toLowerCase();
  const list = [];
  for (const u of users) {
    const { rows: orderRows } = await query('SELECT * FROM orders WHERE user_id=$1 ORDER BY id DESC', [u.id]);
    const orders = orderRows.map(mapOrder);
    const billable = billableOrders(orders);
    const totalPurchase = billable.reduce((s, o) => s + o.total, 0);
    const totalPaid = billable.reduce((s, o) => s + o.paidAmount, 0);
    list.push({
      userId: u.id, customerId: u.customer_id, name: u.catering_name || u.name || '—',
      mobile: u.mobile, address: u.address,
      orderCount: orders.length, totalPurchase, totalPaid,
      pending: totalPurchase - totalPaid, orders,
    });
  }
  const filtered = list.filter((c) =>
    !q || (c.customerId || '').toLowerCase().includes(q) ||
    c.mobile.includes(q) || (c.name || '').toLowerCase().includes(q))
    .sort((a, b) => (a.customerId || '').localeCompare(b.customerId || ''));
  res.json(filtered);
}));

app.get('/customers/:mobile', authRequired, adminRequired, h(async (req, res) => {
  const { rows } = await query("SELECT * FROM users WHERE mobile=$1 AND role='user'", [req.params.mobile]);
  const u = rows[0];
  if (!u) return res.status(404).json({ error: 'Not found' });
  const { rows: orderRows } = await query('SELECT * FROM orders WHERE user_id=$1 ORDER BY id DESC', [u.id]);
  const orders = orderRows.map(mapOrder);
  const billable = billableOrders(orders);
  const totalPurchase = billable.reduce((s, o) => s + o.total, 0);
  const totalPaid = billable.reduce((s, o) => s + o.paidAmount, 0);
  res.json({
    userId: u.id, customerId: u.customer_id, name: u.catering_name || u.name,
    mobile: u.mobile, address: u.address,
    totalPurchase, totalPaid, pending: totalPurchase - totalPaid, orders,
  });
}));

// ══════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════
app.get('/notifications', authRequired, h(async (req, res) => {
  const audience = req.user.role === 'admin' ? 0 : req.user.id;
  const { rows } = await query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY id DESC', [audience]);
  res.json(rows.map(mapNotif));
}));

app.post('/notifications/:id/read', authRequired, h(async (req, res) => {
  const audience = req.user.role === 'admin' ? 0 : req.user.id;
  await query('UPDATE notifications SET read=true WHERE id=$1 AND user_id=$2', [req.params.id, audience]);
  res.json({ ok: true });
}));

app.post('/notifications/read-all', authRequired, h(async (req, res) => {
  const audience = req.user.role === 'admin' ? 0 : req.user.id;
  await query('UPDATE notifications SET read=true WHERE user_id=$1', [audience]);
  res.json({ ok: true });
}));

// Admin-composed notification — separate from the automatic ones `notify()`
// sends on order events. userId omitted/null broadcasts to every customer
// (each gets their own row + push, unlike the internal user_id=0 admin inbox).
app.post('/notifications/send', authRequired, adminRequired, h(async (req, res) => {
  const { userId, message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message required.' });
  if (userId) {
    const target = await getUser(userId);
    if (!target || target.role !== 'user') return res.status(404).json({ error: 'Customer not found.' });
    await notify(userId, message.trim());
    return res.json({ ok: true, sentTo: 1 });
  }
  const sentTo = await notifyAllCustomers(message.trim());
  res.json({ ok: true, sentTo });
}));

// ─── Public config ────────────────────────────────────────────────────────────
// Just the admin contact number for the app's "Call Admin" button — nothing
// sensitive, safe to leave unauthenticated. Set ADMIN_CONTACT_PHONE (E.164,
// e.g. +919876543210) in .env; falls back to the first ADMIN_MOBILES entry.
app.get('/config', (req, res) => {
  const fallback = (process.env.ADMIN_MOBILES || '').split(',')[0]?.trim();
  const adminPhone = process.env.ADMIN_CONTACT_PHONE || (fallback ? `+91${fallback}` : null);
  res.json({ adminPhone });
});

// ─── Health + boot ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ ok: true, time: nowIso() }));

app.use((err, req, res, next) => {
  console.error(err);
  // Every intentional error response is sent directly by its route (400/401/
  // 403/404 above) — anything reaching here is unexpected, so never relay its
  // raw message (stack traces, driver/SQL detail) to the client in production.
  const message = process.env.NODE_ENV === 'production' ? 'Server error' : (err.message || 'Server error');
  res.status(500).json({ error: message });
});

const PORT = process.env.PORT || 4000;
initSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`Roti & More API on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialize database schema:', err);
    process.exit(1);
  });
