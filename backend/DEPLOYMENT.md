# Backend Deployment Guide — Roti & More

This covers deploying just the backend API. Mobile app build/release steps live in
`mobile-app/README.md`; admin dashboard deployment will get its own section once
`admin-web/` is built (Phase 5 of the project roadmap).

---

## 1. Create a free Postgres database

Either works — both have a generous free tier and give you a `DATABASE_URL` connection
string immediately:

- **[Supabase](https://supabase.com)** → New project → Settings → Database → Connection
  string → **URI** (use the "Transaction" pooler string for serverless-style hosts).
- **[Neon](https://neon.tech)** → New project → Connection string (already in the right format).

Either way you'll get something like:
```
postgresql://<user>:<password>@<host>:5432/<database>?sslmode=require
```

## 2. Create a free Firebase project (for OTP)

1. [Firebase console](https://console.firebase.google.com) → Add project (free Spark plan).
2. Authentication → Sign-in method → enable **Phone**.
3. Project settings → Service accounts → **Generate new private key** → downloads a JSON file.
   This file is a secret — never commit it. You'll upload it to your host as an env var or file.

## 3. Deploy the backend (Render — free tier example)

Any Node host works (Render, Railway, Fly.io, a VPS) — these steps are for Render:

1. Push the repo to GitHub.
2. Render → **New → Web Service** → pick the repo, root directory `backend`.
3. Build command: `npm install` · Start command: `npm start`.
   No persistent disk needed — the database is Postgres, hosted elsewhere.
4. Environment variables:
   ```
   DATABASE_URL=<your Supabase/Neon connection string>
   JWT_SECRET=<long random string>
   ADMIN_MOBILES=<owner's 10-digit mobile number(s), comma-separated>
   CORS_ORIGIN=<your mobile app / admin dashboard origins, comma-separated>
   OTP_PROVIDER=firebase
   FIREBASE_SERVICE_ACCOUNT=/etc/secrets/serviceAccountKey.json
   ```
   For `FIREBASE_SERVICE_ACCOUNT`: Render → **Secret Files** → upload the JSON you downloaded
   in step 2, mounted at that path.
5. Deploy. Note the URL, e.g. `https://roti-api.onrender.com`.
6. Seed once (Render Shell): `npm run seed` — creates tables and demo data. Skip this in a
   real launch if you'd rather start with an empty catalog and add products via the admin
   dashboard once it exists.
7. Check `GET /health` returns `{ ok: true }`.

> Render's free tier spins the service down after 15 minutes of inactivity (first request
> after idle takes ~30s to wake up). Fine for testing; worth a paid instance ($7/mo) once
> you have real customers who shouldn't see that delay.

---

## 4. Go-live checklist
- [ ] `JWT_SECRET` is long and random (not the example).
- [ ] `ADMIN_MOBILES` set to the real owner number(s) only.
- [ ] `CORS_ORIGIN` locked to your actual app/admin origins.
- [ ] OTP provider live and tested on a real phone.
- [ ] HTTPS (Render gives it automatically).
- [ ] Product images: use hosted URLs (Firebase Storage / Cloudinary), not base64, to keep
      the database small — wired up in Phase 3/5.
- [ ] Add rate-limiting on `/auth/*` (e.g. `express-rate-limit`) to prevent OTP abuse —
      recommended before public launch.
- [ ] Verify the full flow on production: signup → order → admin accept → pay → customer
      sees status.

---

## 5. Recommended next hardening (post-launch)
- `express-rate-limit` on auth routes.
- Structured logging + error monitoring (Sentry free tier).
- Scheduled Postgres backups (Supabase/Neon both offer this on free/low tiers).
- Websockets or short polling so admin/customer see each other's changes live
  (currently the app must refresh/re-fetch).
