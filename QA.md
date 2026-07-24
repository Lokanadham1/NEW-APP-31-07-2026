# QA — testing status

Honest summary of what's been verified, how, and what's still outstanding before
a public launch. Updated as of the testing pass (Phase 6 of the build roadmap).

## Backend

**Automated** — `backend/test/` (`npm test`), 19 tests, all passing against a real
Postgres instance (not mocks — the actual server process, actual SQL):
- OTP login (dev mode) + admin allowlist → correct `role`
- Authorization boundaries: no token → 401, non-admin on an admin route → 403,
  a customer can't view another customer's order → 403
- Order lifecycle business rules: server recomputes totals from live prices
  (ignores a tampered client price), accept only works once (pending → approved),
  reschedule allowed once for a customer but unlimited for admin, payment can't
  exceed the remaining balance, a full payment auto-completes the order, cancel
  is refused once no longer pending
- The notification-ownership fix (see Security below)
- Admin-composed notifications: broadcast count, single-recipient, unknown
  customer → 404, empty message → 400, non-admin → 403
- Push token register/unregister
- `/auth/*` rate limiting (11th request in the window → 429)

**Manually verified** (curl, throughout development) — full end-to-end flows:
customer OTP login → profile → browse → order → admin accept → payment →
auto-complete → notifications both directions; customer reschedule/cancel/address-edit
windows; admin customer search.

**Not covered**: MSG91/Twilio/Firebase OTP providers only exercised in dev mode
(no live provider credentials in this environment) — the request/response shape is
tested, actual SMS delivery is not. Load/concurrency testing not done (this is a
small-business app, not expected to need it, but worth knowing).

## Mobile app (`mobile-app/`)

The project was originally going to ship a separate browser-based admin dashboard
(`admin-web/`) alongside the app. That was removed by request — the app's own admin
tabs cover the same ground, so there's now a single Android app for both customer
and admin use. Before removal, the dashboard's screens (orders, products, customers,
notifications) were browser-tested end-to-end (Playwright, live backend) and every
one of those flows was carried over into the app's admin tabs against the identical
API — see the note on each business rule below.

**Verified**: the app bundles cleanly via `expo export` after every change (currently
899 modules, zero syntax/import errors). Every screen's API calls were checked by
hand against the backend's actual routes and response shapes. Every
`navigation.navigate()` call in the new admin screens was checked against the
registered route names in `AppNavigator.js`. Business-rule logic (cancel window,
reschedule-once, address-edit-once, out-of-stock handling) mirrors the
already browser-tested behavior exactly, since both talk to the identical
backend API contract.

**Not covered — real limitation, not an oversight**: this sandbox has no Android
emulator or physical device, so **no screen has actually been tapped through on a
running app**. Bundling successfully proves there are no import/syntax errors and
the JS is valid; it does not prove a button is wired to the right handler, that a
layout renders correctly on a real screen size, or that navigation actually lands
where intended at runtime. **Before shipping, walk through the app yourself on a
real device via Expo Go** (`cd mobile-app && npx expo start`, scan the QR code) —
at minimum: full customer flow (login → order → track) and full admin flow (login
→ accept an order → add a product with a photo → send a notification) on both a
customer number and an admin number.

**Not covered**: push notification *delivery* (needs a real Firebase project +
EAS development build — see `mobile-app/README.md` §3); Firebase Phone Auth
*delivery* (same prerequisite, see §2). The dev-mode OTP flow (on-screen code, no
real SMS) is what's been tested.

## Security review

Found and fixed during this pass (see the `Security hardening pass` commit for
full detail):
- **IDOR** on `POST /notifications/:id/read` — didn't check the notification
  belonged to the caller. Fixed: scoped to the caller's own audience.
- **Order id collisions** — 4-digit random ids with no retry on collision would
  start failing within roughly a business's first ~100 orders. Fixed: retries
  with a fresh id on a unique-constraint violation.
- **Error message leakage** — unexpected errors relayed raw internal detail
  (SQL/stack info) to the client. Fixed: generic in production, detailed in dev.
- **No rate limiting** on the three OTP routes — abusable for SMS-cost spam or
  brute-forcing a 4-digit code. Fixed: 10 requests / 15 min / IP.
- **No security headers**. Fixed: `helmet` with its defaults.

**Still worth doing before a public launch** (lower urgency, tracked in
`backend/DEPLOYMENT.md`'s hardening checklist):
- Move product images from base64/data-URL to a hosted URL (Firebase Storage /
  Cloudinary) once volume grows — keeps the database small.
- Structured error monitoring (Sentry free tier) so failures in production are
  visible without SSHing into logs.
- Scheduled Postgres backups (Supabase/Neon both offer this).

## What "done" means here

Everything above that's marked verified was actually exercised against running
code, not assumed from reading it. The one honest gap is real device testing for
the mobile app — that requires a phone, which this environment doesn't have.
Treat that walkthrough as the last gate before Phase 7 (release).
