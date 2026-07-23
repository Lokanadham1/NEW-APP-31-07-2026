// server.js — Express app wiring every feature the Roti & More app uses.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db, mapProduct, mapOrder, mapUser, mapNotif } = require('./db');
const {
  sendOtp, verifyOtp, findOrCreateUser, issueToken,
  authRequired, adminRequired, isValidMobile,
} = require('./auth');

const app = express();
// Lock CORS to your frontend origin in production (comma-separated allowed).
// Leave CORS_ORIGIN unset to allow all (dev only).
const origins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors(origins.length ? { origin: origins } : {}));
app.use(express.json({ limit: '6mb' })); // base64 product images

const today = () => new Date().toISOString().split('T')[0];
const nowIso = () => new Date().toISOString();

// ─── Notification helper ─────────────────────────────────────────────────────
function notify(userId, message) {
  db.prepare(
    `INSERT INTO notifications (user_id, message, read, created_date, created_at)
     VALUES (?, ?, 0, ?, ?)`
  ).run(userId, message, today(), nowIso());
}

// ══════════════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════════════
app.post('/auth/request-otp', async (req, res) => {
  const { mobile } = req.body;
  if (!isValidMobile(mobile)) return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });
  const result = await sendOtp(mobile);
  res.json(result); // { sent:true, devCode? }
});

app.post('/auth/verify-otp', (req, res) => {
  const { mobile, code } = req.body;
  if (!isValidMobile(mobile)) return res.status(400).json({ error: 'Invalid mobile.' });
  const v = verifyOtp(mobile, code);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const user = findOrCreateUser(mobile);
  const token = issueToken(user);
  res.json({
    token,
    role: user.role,
    profileComplete: !!user.profile_done,
    user: mapUser(user),
  });
});

// Firebase Phone Auth: client verifies the OTP with the Firebase SDK, then posts
// the resulting ID token here. We verify it, map the phone to a user, apply the
// same admin allowlist, and issue our own JWT.
app.post('/auth/firebase', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'Missing idToken.' });
    const { verifyFirebaseToken } = require('./firebase');
    const e164 = await verifyFirebaseToken(idToken);       // +919876543210
    const mobile = e164.replace(/^\+91/, '').replace(/^\+/, '');
    if (!isValidMobile(mobile)) return res.status(400).json({ error: 'Unsupported phone number.' });
    const user = findOrCreateUser(mobile);
    res.json({
      token: issueToken(user), role: user.role,
      profileComplete: !!user.profile_done, user: mapUser(user),
    });
  } catch (e) {
    res.status(401).json({ error: e.message || 'Firebase verification failed.' });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════════════════════════════════
app.get('/me', authRequired, (req, res) => res.json(req.userApi));

app.put('/me/profile', authRequired, (req, res) => {
  const { name, cateringName, address } = req.body;
  if (!name?.trim() || !address?.trim())
    return res.status(400).json({ error: 'Name and address are required.' });
  db.prepare(
    `UPDATE users SET name=?, catering_name=?, address=?, profile_done=1 WHERE id=?`
  ).run(name.trim(), (cateringName || '').trim() || null, address.trim(), req.user.id);
  res.json(mapUser(db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id)));
});

// ══════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════════════════════════════════════
app.get('/products', (req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY id').all();
  res.json(rows.map(mapProduct));
});

app.post('/products', authRequired, adminRequired, (req, res) => {
  const { name, price, description, category, status, imageUrl } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'Name and price required.' });
  const info = db.prepare(
    `INSERT INTO products (name, price, description, category, status, image_url)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(name, Number(price), description || '', category || 'Flatbreads',
        status || 'available', imageUrl || null);
  res.status(201).json(mapProduct(db.prepare('SELECT * FROM products WHERE id=?').get(info.lastInsertRowid)));
});

app.put('/products/:id', authRequired, adminRequired, (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const { name, price, description, category, status, imageUrl } = req.body;
  db.prepare(
    `UPDATE products SET name=?, price=?, description=?, category=?, status=?, image_url=? WHERE id=?`
  ).run(name ?? p.name, price != null ? Number(price) : p.price,
        description ?? p.description, category ?? p.category,
        status ?? p.status, imageUrl !== undefined ? imageUrl : p.image_url, p.id);
  res.json(mapProduct(db.prepare('SELECT * FROM products WHERE id=?').get(p.id)));
});

app.delete('/products/:id', authRequired, adminRequired, (req, res) => {
  db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════════
// ORDERS
// ══════════════════════════════════════════════════════════════════════════
const canCancel = (o) =>
  o.status === 'pending' && (Date.now() - new Date(o.created_at).getTime()) < 6 * 3600 * 1000;

// list — users see their own, admin sees all (optional ?status= filter)
app.get('/orders', authRequired, (req, res) => {
  const { status } = req.query;
  let rows;
  if (req.user.role === 'admin') {
    rows = status && status !== 'all'
      ? db.prepare('SELECT * FROM orders WHERE status=? ORDER BY id DESC').all(status)
      : db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
  } else {
    rows = db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC').all(req.user.id);
  }
  res.json(rows.map(mapOrder));
});

app.get('/orders/:id', authRequired, (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && o.user_id !== req.user.id)
    return res.status(403).json({ error: 'Forbidden' });
  res.json(mapOrder(o));
});

// place order (user)
app.post('/orders', authRequired, (req, res) => {
  const u = req.user;
  if (!u.profile_done) return res.status(400).json({ error: 'Complete your profile first.' });
  const { items, deliveryDate, deliveryTime, remarks } = req.body;
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'Cart is empty.' });
  if (!deliveryDate || !deliveryTime)
    return res.status(400).json({ error: 'Select delivery date and time.' });

  // recompute totals server-side from live product prices (never trust client)
  const norm = items.map((it) => {
    const p = db.prepare('SELECT * FROM products WHERE id=?').get(it.productId);
    if (!p) throw new Error('Unknown product ' + it.productId);
    return { productId: p.id, name: p.name, price: p.price, quantity: Math.max(1, +it.quantity) };
  });
  const subtotal = norm.reduce((s, i) => s + i.price * i.quantity, 0);

  const id = Math.floor(1000 + Math.random() * 9000);
  const displayName = u.catering_name || u.name;
  db.prepare(
    `INSERT INTO orders (id,user_id,customer_name,customer_mobile,customer_address,
       items_json,subtotal,gst,delivery,total,status,created_date,created_at,
       delivery_date,delivery_time,remarks,contact_person,paid_amount,payments_json,
       address_edit_used,reschedule_used)
     VALUES (?,?,?,?,?,?,?,0,0,?,'pending',?,?,?,?,?,?,0,'[]',0,0)`
  ).run(id, u.id, displayName, u.mobile, u.address, JSON.stringify(norm),
        subtotal, subtotal, today(), nowIso(), deliveryDate, deliveryTime,
        remarks || null, u.name);

  notify(0, `New Order #${id} from ${displayName} (${u.mobile}) — ₹${subtotal} | Delivery: ${deliveryDate} at ${deliveryTime}`);
  res.status(201).json(mapOrder(db.prepare('SELECT * FROM orders WHERE id=?').get(id)));
});

// accept (admin)
app.post('/orders/:id/accept', authRequired, adminRequired, (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  if (o.status !== 'pending') return res.status(400).json({ error: 'Only pending orders can be accepted.' });
  db.prepare("UPDATE orders SET status='approved' WHERE id=?").run(o.id);
  notify(o.user_id, `🟢 Order #${o.id} accepted! Delivery: ${o.delivery_date} at ${o.delivery_time}. Total: ₹${o.total}`);
  res.json(mapOrder(db.prepare('SELECT * FROM orders WHERE id=?').get(o.id)));
});

// reject (admin)
app.post('/orders/:id/reject', authRequired, adminRequired, (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  db.prepare("UPDATE orders SET status='rejected' WHERE id=?").run(o.id);
  notify(o.user_id, `🔴 Order #${o.id} could not be accepted. Please contact us.`);
  res.json(mapOrder(db.prepare('SELECT * FROM orders WHERE id=?').get(o.id)));
});

// mark delivered (admin)
app.post('/orders/:id/deliver', authRequired, adminRequired, (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  db.prepare("UPDATE orders SET status='completed' WHERE id=?").run(o.id);
  notify(o.user_id, `📦 Order #${o.id} marked delivered.`);
  res.json(mapOrder(db.prepare('SELECT * FROM orders WHERE id=?').get(o.id)));
});

// cancel (user, within 6h & pending)
app.post('/orders/:id/cancel', authRequired, (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  if (o.user_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });
  if (!canCancel(o)) return res.status(400).json({ error: 'Cancellation window has closed (6 hours, pending only).' });
  db.prepare("UPDATE orders SET status='cancelled' WHERE id=?").run(o.id);
  notify(0, `🚫 Order #${o.id} was cancelled by customer.`);
  res.json(mapOrder(db.prepare('SELECT * FROM orders WHERE id=?').get(o.id)));
});

// reschedule (user once, or admin any time)
app.post('/orders/:id/reschedule', authRequired, (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  const { deliveryDate, deliveryTime } = req.body;
  if (!deliveryDate || !deliveryTime) return res.status(400).json({ error: 'Date and time required.' });
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin) {
    if (o.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (o.reschedule_used) return res.status(400).json({ error: 'You can reschedule an order only once.' });
  }
  db.prepare(
    `UPDATE orders SET delivery_date=?, delivery_time=?, reschedule_used=? WHERE id=?`
  ).run(deliveryDate, deliveryTime, isAdmin ? o.reschedule_used : 1, o.id);
  notify(isAdmin ? o.user_id : 0,
    `${isAdmin ? '⏰ Delivery rescheduled for' : '📅 Customer rescheduled'} #${o.id}: ${deliveryDate} at ${deliveryTime}`);
  res.json(mapOrder(db.prepare('SELECT * FROM orders WHERE id=?').get(o.id)));
});

// edit delivery address (user, once)
app.put('/orders/:id/address', authRequired, (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  if (o.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (o.address_edit_used) return res.status(400).json({ error: 'Address can be edited only once.' });
  const { address } = req.body;
  if (!address?.trim()) return res.status(400).json({ error: 'Address required.' });
  db.prepare('UPDATE orders SET customer_address=?, address_edit_used=1 WHERE id=?').run(address.trim(), o.id);
  notify(0, `📍 Customer updated delivery address for Order #${o.id}: ${address.trim()}`);
  res.json(mapOrder(db.prepare('SELECT * FROM orders WHERE id=?').get(o.id)));
});

// record payment (admin)
app.post('/orders/:id/payments', authRequired, adminRequired, (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
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
  db.prepare('UPDATE orders SET paid_amount=?, payments_json=?, status=? WHERE id=?')
    .run(newPaid, JSON.stringify(payments), newStatus, o.id);
  notify(o.user_id, newBal <= 0
    ? `✅ Order #${o.id} fully paid. Thank you!`
    : `💰 Payment of ₹${amt} for order #${o.id}. Balance: ₹${newBal}`);
  res.json(mapOrder(db.prepare('SELECT * FROM orders WHERE id=?').get(o.id)));
});

// bill data (either party on their order)
app.get('/orders/:id/bill', authRequired, (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && o.user_id !== req.user.id)
    return res.status(403).json({ error: 'Forbidden' });
  const cust = db.prepare('SELECT * FROM users WHERE id=?').get(o.user_id);
  const order = mapOrder(o);
  res.json({
    billNo: 'BILL' + o.id,
    order,
    customer: { name: o.customer_name, customerId: cust?.customer_id, mobile: o.customer_mobile },
    balance: Math.max(0, o.total - o.paid_amount),
  });
});

// ══════════════════════════════════════════════════════════════════════════
// CUSTOMERS (admin)
// ══════════════════════════════════════════════════════════════════════════
app.get('/customers', authRequired, adminRequired, (req, res) => {
  const users = db.prepare("SELECT * FROM users WHERE role='user'").all();
  const q = (req.query.q || '').toLowerCase();
  const list = users.map((u) => {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC').all(u.id).map(mapOrder);
    const totalPurchase = orders.reduce((s, o) => s + o.total, 0);
    const totalPaid = orders.reduce((s, o) => s + o.paidAmount, 0);
    return {
      userId: u.id, customerId: u.customer_id, name: u.catering_name || u.name || '—',
      mobile: u.mobile, address: u.address,
      orderCount: orders.length, totalPurchase, totalPaid,
      pending: totalPurchase - totalPaid, orders,
    };
  }).filter((c) =>
    !q || (c.customerId || '').toLowerCase().includes(q) ||
    c.mobile.includes(q) || (c.name || '').toLowerCase().includes(q))
    .sort((a, b) => (a.customerId || '').localeCompare(b.customerId || ''));
  res.json(list);
});

app.get('/customers/:mobile', authRequired, adminRequired, (req, res) => {
  const u = db.prepare("SELECT * FROM users WHERE mobile=? AND role='user'").get(req.params.mobile);
  if (!u) return res.status(404).json({ error: 'Not found' });
  const orders = db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC').all(u.id).map(mapOrder);
  const totalPurchase = orders.reduce((s, o) => s + o.total, 0);
  const totalPaid = orders.reduce((s, o) => s + o.paidAmount, 0);
  res.json({
    userId: u.id, customerId: u.customer_id, name: u.catering_name || u.name,
    mobile: u.mobile, address: u.address,
    totalPurchase, totalPaid, pending: totalPurchase - totalPaid, orders,
  });
});

// ══════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════
app.get('/notifications', authRequired, (req, res) => {
  const audience = req.user.role === 'admin' ? 0 : req.user.id;
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC').all(audience);
  res.json(rows.map(mapNotif));
});

app.post('/notifications/:id/read', authRequired, (req, res) => {
  db.prepare('UPDATE notifications SET read=1 WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

app.post('/notifications/read-all', authRequired, (req, res) => {
  const audience = req.user.role === 'admin' ? 0 : req.user.id;
  db.prepare('UPDATE notifications SET read=1 WHERE user_id=?').run(audience);
  res.json({ ok: true });
});

// ─── Health + boot ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ ok: true, time: nowIso() }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Roti & More API on http://localhost:${PORT}`));
