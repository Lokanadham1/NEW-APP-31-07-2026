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
