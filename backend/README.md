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

### Products
| GET | `/products` | | public |
| POST | `/products` | product | admin |
| PUT | `/products/:id` | partial | admin |
| DELETE | `/products/:id` | | admin |

### Orders (auth)
| GET | `/orders?status=` | | user: own · admin: all (filter) |
| GET | `/orders/:id` | | owner or admin |
| POST | `/orders` | `{items:[{productId,quantity}], deliveryDate, deliveryTime, remarks}` | totals recomputed server-side |
| POST | `/orders/:id/accept` | | admin |
| POST | `/orders/:id/reject` | | admin |
| POST | `/orders/:id/deliver` | | admin |
| POST | `/orders/:id/cancel` | | user, pending & within 6h |
| POST | `/orders/:id/reschedule` | `{deliveryDate, deliveryTime}` | user once · admin any time |
| PUT | `/orders/:id/address` | `{address}` | user, once |
| POST | `/orders/:id/payments` | `{amount, note, mode, transactionId}` | admin; auto-completes when balance clears |
| GET | `/orders/:id/bill` | | bill payload for print |

### Customers (admin)
| GET | `/customers?q=` | search by id/mobile/name |
| GET | `/customers/:mobile` | profile + orders + totals |

### Notifications (auth)
| GET | `/notifications` | user: own · admin: broadcast (`user_id=0`) |
| POST | `/notifications/:id/read` | |
| POST | `/notifications/read-all` | |

## Business rules enforced server-side
- Order totals are recomputed from live product prices — client amounts are ignored.
- Cancel allowed only while `pending` and within 6 hours of creation.
- Reschedule: customers once; admins unlimited.
- Delivery address edit: once per order.
- Payment cannot exceed the remaining balance; order auto-moves to `completed`
  when fully paid.

## Wiring the frontend
The app currently uses `localStorage`. Replace those reads/writes with `fetch`
calls to these endpoints, store the JWT from `verify-otp`, and send it as
`Authorization: Bearer <token>` on every authed request. Route on the `role`
field returned by `verify-otp`.
