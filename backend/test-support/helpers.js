// Shared helpers for the API tests: spawn the real server as a child process
// (so tests exercise the actual boot sequence, middleware stack, and
// Postgres queries — not a mocked app) and a small fetch wrapper.
const { spawn } = require('node:child_process');
const path = require('node:path');

async function waitForHealth(base, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${base}/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server at ${base} did not become healthy within ${timeoutMs}ms`);
}

// Starts backend/server.js on `port` against TEST_DATABASE_URL (falls back to
// DATABASE_URL). Returns { baseUrl, stop() }.
async function startServer(port, extraEnv = {}) {
  const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Set TEST_DATABASE_URL (or DATABASE_URL) to a throwaway Postgres database before running tests.');
  }
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_URL: databaseUrl,
      JWT_SECRET: 'test-secret-do-not-use-in-prod',
      ADMIN_MOBILES: '9199999999',
      OTP_PROVIDER: '',
      CORS_ORIGIN: '',
      FIREBASE_SERVICE_ACCOUNT: '',
      NODE_ENV: 'test',
      ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  child.stdout.on('data', (d) => { output += d; });
  child.stderr.on('data', (d) => { output += d; });

  const baseUrl = `http://localhost:${port}`;
  try {
    await waitForHealth(baseUrl);
  } catch (e) {
    child.kill();
    throw new Error(`${e.message}\n--- server output ---\n${output}`);
  }

  return {
    baseUrl,
    stop: () => child.kill(),
  };
}

// Thin fetch wrapper: returns { status, body }.
async function call(base, path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

// Runs the OTP dev-mode flow for a mobile number and returns the JWT + user.
async function loginAs(base, mobile) {
  const req = await call(base, '/auth/request-otp', { method: 'POST', body: { mobile } });
  const code = req.body.devCode;
  const verify = await call(base, '/auth/verify-otp', { method: 'POST', body: { mobile, code } });
  return verify.body; // { token, role, profileComplete, user }
}

module.exports = { startServer, call, loginAs };
