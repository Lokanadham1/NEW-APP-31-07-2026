// Isolated from api.test.js on purpose: exhausting the OTP rate limit here
// would otherwise eat into the budget the main suite needs for its own
// logins. A fresh server process means a fresh in-memory rate-limit store.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, call } = require('../test-support/helpers');

const PORT = 4102;
let server;
let base;

before(async () => {
  server = await startServer(PORT);
  base = server.baseUrl;
});

after(() => {
  server.stop();
});

test('/auth/request-otp is rate-limited per IP after 10 requests in the window', async () => {
  let lastStatus;
  for (let i = 0; i < 11; i += 1) {
    const res = await call(base, '/auth/request-otp', { method: 'POST', body: { mobile: '9100000000' } });
    lastStatus = res.status;
    if (i < 10) assert.equal(res.status, 200, `request ${i + 1} should succeed`);
  }
  assert.equal(lastStatus, 429, 'the 11th request within the window should be rate-limited');
});
