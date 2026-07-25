// Backend API test suite. Run: TEST_DATABASE_URL=postgresql://... npm test
//
// Exercises the real server (spawned as a child process) against a throwaway
// Postgres database — not mocks — so these tests catch the same class of bug
// the manual curl/Playwright passes did during development: wrong route
// wiring, wrong SQL, wrong authorization checks.
//
// OTP calls are rate-limited (10 / 15min / IP, see server.js) and shared
// across every test in this file since they all hit the same server process.
// Kept to 9 total below — see the comment on each login. The rate-limit
// behavior itself is tested separately, against its own server instance, in
// rate-limit.test.js.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, call, loginAs } = require('../test-support/helpers');

const PORT = 4101;
let server;
let base;

// Shared fixtures, populated in before().
let customer1, customer2, admin;
let productId;
let orderId;

before(async () => {
  server = await startServer(PORT);
  base = server.baseUrl;

  customer1 = await loginAs(base, '9111111111'); // OTP call 1-2
  customer2 = await loginAs(base, '9111111112'); // OTP call 3-4
  admin = await loginAs(base, '9199999999');     // OTP call 5-6

  assert.equal(customer1.role, 'user');
  assert.equal(admin.role, 'admin');

  // customer1 needs a completed profile before they can order.
  const profile = await call(base, '/me/profile', {
    method: 'PUT', token: customer1.token,
    body: { name: 'Test Customer', address: '1 Test Street' },
  });
  assert.equal(profile.status, 200);

  const product = await call(base, '/products', {
    method: 'POST', token: admin.token,
    body: { name: 'Test Poli', price: 30, category: 'Flatbreads' },
  });
  assert.equal(product.status, 201);
  productId = product.body.id;
});

after(() => {
  server.stop();
});

test('health check', async () => {
  const res = await call(base, '/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('rejects an invalid mobile number', async () => {
  const res = await call(base, '/auth/request-otp', { method: 'POST', body: { mobile: '123' } }); // OTP call 7
  assert.equal(res.status, 400);
});

test('rejects a wrong OTP code', async () => {
  const req = await call(base, '/auth/request-otp', { method: 'POST', body: { mobile: '9111111113' } }); // OTP call 8
  const wrongCode = req.body.devCode === '0000' ? '1111' : '0000'; // guaranteed to differ from the real code
  const verify = await call(base, '/auth/verify-otp', { // OTP call 9
    method: 'POST', body: { mobile: '9111111113', code: wrongCode },
  });
  assert.equal(verify.status, 400);
});

test('admin allowlist grants role=admin, others get role=user', async () => {
  assert.equal(admin.role, 'admin');
  assert.equal(admin.user.customerId, null); // admins don't get a CUS#### id
  assert.equal(customer1.user.customerId?.startsWith('CUS'), true);
});

test('no token -> 401, non-admin on admin route -> 403', async () => {
  const noToken = await call(base, '/me');
  assert.equal(noToken.status, 401);

  const forbidden = await call(base, '/products', {
    method: 'POST', token: customer1.token, body: { name: 'x', price: 1 },
  });
  assert.equal(forbidden.status, 403);
});

test('order totals are recomputed server-side, ignoring client-sent price', async () => {
  const res = await call(base, '/orders', {
    method: 'POST', token: customer1.token,
    body: {
      // a tampered price here should be ignored — server looks up the real one
      items: [{ productId, quantity: 2, price: 1 }],
      deliveryDate: '2026-08-01', deliveryTime: '10:00',
    },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.total, 60); // 2 * 30, not 2 * 1
  orderId = res.body.id;
});

test('customer cannot view another customer\'s order', async () => {
  const res = await call(base, `/orders/${orderId}`, { token: customer2.token });
  assert.equal(res.status, 403);
});

test('admin sees the order and can accept it', async () => {
  const list = await call(base, '/orders?status=pending', { token: admin.token });
  assert.equal(list.status, 200);
  assert.ok(list.body.some((o) => o.id === orderId));

  const accept = await call(base, `/orders/${orderId}/accept`, { method: 'POST', token: admin.token });
  assert.equal(accept.status, 200);
  assert.equal(accept.body.status, 'approved');
});

test('accepting a non-pending order is rejected', async () => {
  const res = await call(base, `/orders/${orderId}/accept`, { method: 'POST', token: admin.token });
  assert.equal(res.status, 400);
});

test('reschedule is allowed once for a customer, then blocked', async () => {
  const first = await call(base, `/orders/${orderId}/reschedule`, {
    method: 'POST', token: customer1.token,
    body: { deliveryDate: '2026-08-02', deliveryTime: '11:00' },
  });
  assert.equal(first.status, 200);
  assert.equal(first.body.rescheduleUsed, true);

  const second = await call(base, `/orders/${orderId}/reschedule`, {
    method: 'POST', token: customer1.token,
    body: { deliveryDate: '2026-08-03', deliveryTime: '13:00' },
  });
  assert.equal(second.status, 400);
});

test('admin can reschedule unlimited times regardless of the customer\'s one-time use', async () => {
  const res = await call(base, `/orders/${orderId}/reschedule`, {
    method: 'POST', token: admin.token,
    body: { deliveryDate: '2026-08-04', deliveryTime: '15:00' },
  });
  assert.equal(res.status, 200);
});

test('payment cannot exceed the remaining balance', async () => {
  const res = await call(base, `/orders/${orderId}/payments`, {
    method: 'POST', token: admin.token, body: { amount: 999, mode: 'Cash' },
  });
  assert.equal(res.status, 400);
});

test('a full payment auto-completes the order', async () => {
  const res = await call(base, `/orders/${orderId}/payments`, {
    method: 'POST', token: admin.token, body: { amount: 60, mode: 'Cash' },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'completed');
  assert.equal(res.body.paidAmount, 60);
});

test('cancel is refused once an order is no longer pending', async () => {
  const res = await call(base, `/orders/${orderId}/cancel`, { method: 'POST', token: customer1.token });
  assert.equal(res.status, 400);
});

test('a customer cannot mark another audience\'s notification as read (IDOR check)', async () => {
  // The order-accept above sent customer1 a notification. Confirm customer2
  // marking that same id as read has no effect on it.
  const mine = await call(base, '/notifications', { token: customer1.token });
  const target = mine.body[0];
  assert.ok(target && !target.read);

  const attempt = await call(base, `/notifications/${target.id}/read`, { method: 'POST', token: customer2.token });
  assert.equal(attempt.status, 200); // request succeeds, but should be a no-op

  const after = await call(base, '/notifications', { token: customer1.token });
  const stillThere = after.body.find((n) => n.id === target.id);
  assert.equal(stillThere.read, false, 'a different user marking it read must not affect it');

  const own = await call(base, `/notifications/${target.id}/read`, { method: 'POST', token: customer1.token });
  assert.equal(own.status, 200);
  const afterOwn = await call(base, '/notifications', { token: customer1.token });
  assert.equal(afterOwn.body.find((n) => n.id === target.id).read, true);
});

test('admin-composed notification: broadcast, single recipient, validation', async () => {
  const empty = await call(base, '/notifications/send', {
    method: 'POST', token: admin.token, body: { message: '   ' },
  });
  assert.equal(empty.status, 400);

  const unknown = await call(base, '/notifications/send', {
    method: 'POST', token: admin.token, body: { userId: 999999, message: 'hi' },
  });
  assert.equal(unknown.status, 404);

  const single = await call(base, '/notifications/send', {
    method: 'POST', token: admin.token, body: { userId: customer1.user.id, message: 'Direct message' },
  });
  assert.equal(single.status, 200);
  assert.equal(single.body.sentTo, 1);

  const broadcast = await call(base, '/notifications/send', {
    method: 'POST', token: admin.token, body: { message: 'Broadcast message' },
  });
  assert.equal(broadcast.status, 200);
  assert.equal(broadcast.body.sentTo, 2); // customer1 + customer2

  const nonAdmin = await call(base, '/notifications/send', {
    method: 'POST', token: customer1.token, body: { message: 'hi' },
  });
  assert.equal(nonAdmin.status, 403);
});

test('customers list search and per-customer detail', async () => {
  const list = await call(base, '/customers', { token: admin.token });
  assert.equal(list.status, 200);
  assert.ok(list.body.some((c) => c.mobile === '9111111111'));

  const detail = await call(base, '/customers/9111111111', { token: admin.token });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.totalPaid, 60);
});

test('push token register/unregister', async () => {
  const reg = await call(base, '/me/push-token', {
    method: 'POST', token: customer1.token, body: { token: 'test-fcm-token', platform: 'android' },
  });
  assert.equal(reg.status, 200);

  const unreg = await call(base, '/me/push-token', {
    method: 'DELETE', token: customer1.token, body: { token: 'test-fcm-token' },
  });
  assert.equal(unreg.status, 200);
});

test('public config exposes the admin contact number, no auth needed', async () => {
  const res = await call(base, '/config');
  assert.equal(res.status, 200);
  assert.equal(res.body.adminPhone, '+919199999999');
});

test('order status pipeline: sequential steps enforced, deliver stays a manual override', async () => {
  const placed = await call(base, '/orders', {
    method: 'POST', token: customer1.token,
    body: { items: [{ productId, quantity: 1 }], deliveryDate: '2026-09-01', deliveryTime: '10:00' },
  });
  const pid = placed.body.id;

  // Can't jump straight into the kitchen pipeline from pending.
  const tooEarly = await call(base, `/orders/${pid}/prepare`, { method: 'POST', token: admin.token });
  assert.equal(tooEarly.status, 400);

  await call(base, `/orders/${pid}/accept`, { method: 'POST', token: admin.token });

  const prepare = await call(base, `/orders/${pid}/prepare`, { method: 'POST', token: admin.token });
  assert.equal(prepare.status, 200);
  assert.equal(prepare.body.status, 'preparing');

  // Can't skip "ready" and jump straight to out-for-delivery.
  const skip = await call(base, `/orders/${pid}/out-for-delivery`, { method: 'POST', token: admin.token });
  assert.equal(skip.status, 400);

  const ready = await call(base, `/orders/${pid}/ready`, { method: 'POST', token: admin.token });
  assert.equal(ready.status, 200);
  assert.equal(ready.body.status, 'ready');

  const outForDelivery = await call(base, `/orders/${pid}/out-for-delivery`, { method: 'POST', token: admin.token });
  assert.equal(outForDelivery.status, 200);
  assert.equal(outForDelivery.body.status, 'out_for_delivery');

  const delivered = await call(base, `/orders/${pid}/deliver`, { method: 'POST', token: admin.token });
  assert.equal(delivered.status, 200);
  assert.equal(delivered.body.status, 'completed');
});

test('admin order list sorts pending before completed, regardless of id', async () => {
  const fresh = await call(base, '/orders', {
    method: 'POST', token: customer1.token,
    body: { items: [{ productId, quantity: 1 }], deliveryDate: '2026-09-10', deliveryTime: '10:00' },
  });
  const list = await call(base, '/orders', { token: admin.token });
  const idxPending = list.body.findIndex((o) => o.id === fresh.body.id);
  const idxCompleted = list.body.findIndex((o) => o.status === 'completed');
  assert.ok(idxPending !== -1 && idxCompleted !== -1);
  assert.ok(idxPending < idxCompleted, 'a pending order must sort before a completed one');
});

test('admin dashboard: today\'s counts and per-product breakdown', async () => {
  const nonAdmin = await call(base, '/admin/dashboard', { token: customer1.token });
  assert.equal(nonAdmin.status, 403);

  const res = await call(base, '/admin/dashboard', { token: admin.token });
  assert.equal(res.status, 200);
  assert.ok(res.body.totalToday >= 1);
  assert.ok(Array.isArray(res.body.products));
  const entry = res.body.products.find((p) => p.productId === productId);
  assert.ok(entry, 'the product used throughout these tests should appear in today\'s breakdown');
  assert.equal(entry.remainingQty, entry.orderedQty - entry.completedQty);
});

test('customer dashboard: lifetime summary excludes rejected/cancelled orders', async () => {
  const before = await call(base, '/me/dashboard', { token: customer1.token });
  assert.equal(before.status, 200);
  const ordersBefore = before.body.totalOrders;
  const qtyBefore = before.body.totalQuantityOrdered;

  const placed = await call(base, '/orders', {
    method: 'POST', token: customer1.token,
    body: { items: [{ productId, quantity: 3 }], deliveryDate: '2026-09-11', deliveryTime: '11:00' },
  });
  assert.equal(placed.status, 201);
  await call(base, `/orders/${placed.body.id}/reject`, { method: 'POST', token: admin.token });

  const after = await call(base, '/me/dashboard', { token: customer1.token });
  assert.equal(after.status, 200);
  // totalOrders counts every order placed (including this now-rejected one)...
  assert.equal(after.body.totalOrders, ordersBefore + 1);
  // ...but the rejected order's quantity must not leak into the money/quantity totals.
  assert.equal(after.body.totalQuantityOrdered, qtyBefore);
});

test('product create/update notifies customers only when it actually matters', async () => {
  const before = await call(base, '/notifications', { token: customer1.token });
  const beforeCount = before.body.length;

  // A brand new product always notifies.
  const created = await call(base, '/products', {
    method: 'POST', token: admin.token, body: { name: 'Gulab Jamun', price: 20, category: 'Desserts' },
  });
  assert.equal(created.status, 201);

  // A price change notifies.
  const priceChanged = await call(base, `/products/${created.body.id}`, {
    method: 'PUT', token: admin.token, body: { price: 25 },
  });
  assert.equal(priceChanged.status, 200);

  // A no-op update (same price, same status) should NOT notify again.
  const noop = await call(base, `/products/${created.body.id}`, {
    method: 'PUT', token: admin.token, body: { price: 25, description: 'still tasty' },
  });
  assert.equal(noop.status, 200);

  const after = await call(base, '/notifications', { token: customer1.token });
  // Exactly 2 new alerts: the create, and the one real price change.
  assert.equal(after.body.length, beforeCount + 2);
});
