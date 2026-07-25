# Roti & More — Backend API

Node.js + Express + Postgres backend that powers every feature in the Roti & More app:
mobile-OTP auth with a server-side admin allowlist, profiles, product catalog CRUD,
the full order lifecycle (place / accept / reject / reschedule / cancel / deliver),
payments, bills, customers, and notifications.

## Stack
- **Express** — HTTP API
- **Postgres** (via `pg`) — free-tier hosted database (Supabase or Neon; see `DEPLOYMENT.md`)
- **jsonwebtoken** — 30-day JWTs carrying `{ sub, mobile, role }`
- OTP delivery is pluggable: **dev mode** (default), **Firebase Phone Auth**, **MSG91**, or **Twilio Verify**

## Setup
```bash
cd backend
npm install
cp .env.example .env      # set DATABASE_URL, JWT_SECRET and ADMIN_MOBILES
npm run seed              # optional: demo products/customers/orders (also creates tables)
npm start                 # http://localhost:4000
```

## Testing
```bash
# Point at a throwaway Postgres database — tests create/reuse tables in it,
# never your dev or production database.
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/roti_apitest npm test
```
Spawns the real server as a child process (not a mock) against that database and
runs the full request lifecycle over HTTP: OTP login (admin allowlist included),
authorization boundaries (401/403), the order lifecycle's business rules (server-side
price recomputation, once-only reschedule/address-edit, 6-hour cancel window, payment
can't exceed the balance), the notification-ownership fix, admin broadcast/send
validation, and the `/auth/*` rate limit. `test/rate-limit.test.js` runs against its
own server instance (a fresh in-memory limiter) so it doesn't eat into the OTP-call
budget the main suite needs for its own logins.

## How admin access works (no second login)
- `ADMIN_MOBILES` in `.env` is the **server-side allowlist** (e.g. `7730001663`).
- On `verify-otp` the server checks the number against that list and stamps
  `role: "admin"` or `role: "user"` into the signed JWT.
- Every admin route is guarded by `adminRequired`, which reads the role **from the
  verified token** — the client cannot promote itself.
- Admins are created with `profile_done = 1`, so they skip profile setup and land
  straight on the dashboard.

## OTP in development
With `OTP_PROVIDER` empty, no SMS is sent — the 4-digit code is printed to the
server console **and** returned as `devCode` in the `/auth/request-otp` response so
you can test end-to-end for free. Fill the provider keys in `.env` to go live.

**Firebase Phone Auth** (the recommended path — see `DEPLOYMENT.md`): the client does
the OTP with the Firebase SDK, then posts the resulting ID token to `POST /auth/firebase`
(implemented in `firebase.js` + `server.js`), which verifies it with the Admin SDK and
issues the same JWT (same allowlist logic as `/auth/verify-otp`). Set
`FIREBASE_SERVICE_ACCOUNT` to the path of your downloaded service-account JSON to enable it.

## API

### Auth
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/request-otp` | `{mobile}` | Dev/MSG91/Twilio path. Dev mode returns `{devCode}`. |
| POST | `/auth/verify-otp` | `{mobile, code}` | Dev/MSG91/Twilio path → `{token, role, profileComplete, user}` |
| POST | `/auth/firebase` | `{idToken}` | Firebase Phone Auth path → same response shape |

### Profile (auth)
| GET | `/me` | | current user |
| PUT | `/me/profile` | `{name, cateringName, address}` | marks profile complete |
| GET | `/me/dashboard` | | lifetime summary for the signed-in customer: total orders, distinct items ordered, total quantity, bill amount, outstanding balance (rejected/cancelled orders excluded) |

### Products
| GET | `/products` | | public |
| POST | `/products` | product | admin |
| PUT | `/products/:id` | partial | admin |
| DELETE | `/products/:id` | | admin |

### Orders (auth)
| GET | `/orders?status=` | | user: own · admin: all (pending-first when unfiltered) |
| GET | `/orders/:id` | | owner or admin |
| POST | `/orders` | `{items:[{productId,quantity}], deliveryDate, deliveryTime, remarks}` | totals recomputed server-side |
| POST | `/orders/:id/accept` | | admin; `pending` → `approved` |
| POST | `/orders/:id/reject` | | admin; → `rejected` |
| POST | `/orders/:id/prepare` | | admin; `approved` → `preparing` |
| POST | `/orders/:id/ready` | | admin; `preparing` → `ready` |
| POST | `/orders/:id/out-for-delivery` | | admin; `ready` → `out_for_delivery` |
| POST | `/orders/:id/deliver` | | admin; → `completed` (works from any status, manual override) |
| POST | `/orders/:id/cancel` | | user, pending & within 6h |
| POST | `/orders/:id/reschedule` | `{deliveryDate, deliveryTime}` | user once · admin any time |
| PUT | `/orders/:id/address` | `{address}` | user, once |
| POST | `/orders/:id/payments` | `{amount, note, mode, transactionId}` | admin; auto-completes when balance clears |
| GET | `/orders/:id/bill` | | bill payload for print |

Order status pipeline: `pending → approved → preparing → ready → out_for_delivery → completed`,
with `rejected`/`cancelled` as terminal branches off `pending`. Each kitchen step
(`prepare`/`ready`/`out-for-delivery`) only succeeds from its direct predecessor — the UI
can't skip a stage — while `deliver` stays a permissive manual override from any status,
matching how it always worked.

### Customers (admin)
| GET | `/customers?q=` | search by id/mobile/name |
| GET | `/customers/:mobile` | profile + orders + totals |

### Admin dashboard (auth, admin)
| GET | `/admin/dashboard` | | today's order counts by stage + per-product ordered/completed/remaining quantities, scoped to orders placed today |

### Public config
| GET | `/config` | | `{adminPhone}` for the app's "Call Admin" button — unauthenticated, non-sensitive |

### Notifications (auth)
| GET | `/notifications` | user: own · admin: broadcast (`user_id=0`) |
| POST | `/notifications/:id/read` | |
| POST | `/notifications/read-all` | |
| POST | `/notifications/send` | `{userId?, message}` | admin; omit `userId` to broadcast to every customer |
| POST | `/me/push-token` | `{token, platform}` | registers an FCM device token for push |
| DELETE | `/me/push-token` | `{token}` | unregisters (call on logout) |

Every `notify()` call (new order → admins, accept/reject/deliver/payment → the
customer, cancel/reschedule/address-edit → the other party) writes the in-app
notification row **and** best-effort pushes it via FCM to whichever device
tokens that audience has registered. Push is entirely optional: with
`FIREBASE_SERVICE_ACCOUNT` unset it silently no-ops — nothing breaks, you just
don't get pushes, so you can develop everything else before setting up
Firebase. Dead tokens (uninstalled app) are pruned automatically from FCM's
response.

## Business rules enforced server-side
- Order totals are recomputed from live product prices — client amounts are ignored.
- Cancel allowed only while `pending` and within 6 hours of creation.
- Reschedule: customers once; admins unlimited.
- Delivery address edit: once per order.
- Payment cannot exceed the remaining balance; order auto-moves to `completed`
  when fully paid.
- Kitchen pipeline steps (`prepare`/`ready`/`out-for-delivery`) only succeed from
  their direct predecessor status.
- Product create always notifies every customer; product update notifies them only
  when price or availability actually changed (not on every edit).
