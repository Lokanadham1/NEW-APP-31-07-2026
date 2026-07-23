# Deployment Guide — Roti & More

Get the backend and frontend live. Order: **integrate & test locally → deploy
backend → deploy frontend → point the app at the live API → go-live checks.**

---

## 0. Before deploying
- [ ] Applied `INTEGRATION.md` — the React app calls the API, not `localStorage`.
- [ ] Tested locally: backend (`npm start`) + app (`npm run dev`), logged in as
      customer and admin, placed → accepted → paid an order.
- [ ] Chose an OTP path: dev mode (testing) or Firebase (`FIREBASE_SETUP.md`).

---

## 1. Deploy the backend (Render — free tier example)
Any Node host works (Render, Railway, Fly.io, a VPS). Render steps:

1. Push the repo to GitHub.
2. Render → **New → Web Service** → pick the repo, root dir `backend`.
3. Build command: `npm install` · Start command: `npm start`.
4. **Add a persistent disk** (Render → Disks), mount at `/data`. SQLite needs a
   real disk or it resets on every deploy.
5. Environment variables:
   ```
   JWT_SECRET=<long random string>
   ADMIN_MOBILES=7730001663
   DB_PATH=/data/roti.db
   CORS_ORIGIN=https://your-frontend-domain
   OTP_PROVIDER=firebase           # or empty for dev
   FIREBASE_SERVICE_ACCOUNT=/data/serviceAccountKey.json   # upload the file to the disk
   ```
6. Deploy. Note the URL, e.g. `https://roti-api.onrender.com`.
7. Seed once (Render Shell): `npm run seed` — or skip and let real data accrue.
8. Check `GET /health` returns `{ ok: true }`.

> **Scaling later:** SQLite is fine for a single small instance. If you need
> multiple instances or managed backups, switch `db.js` to Postgres
> (`pg` + same queries) — the API layer doesn't change.

---

## 2. Deploy the frontend (Netlify or Vercel)
The app is Vite/React. Netlify steps:

1. Netlify → **Add new site → import from Git** → repo root `roti-and-more-app`.
2. Build command: `npm run build` · Publish dir: `dist`.
3. Environment variables (Site settings → Environment):
   ```
   VITE_API_URL=https://roti-api.onrender.com
   VITE_FB_API_KEY=...
   VITE_FB_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FB_PROJECT_ID=your-project
   VITE_FB_APP_ID=...
   ```
4. Deploy. Note the URL and put it in the backend's `CORS_ORIGIN`, then redeploy
   the backend.
5. In Firebase → Authentication → Settings → **Authorized domains**, add the
   Netlify domain.

The repo already has `netlify.toml` — verify its build settings match.

---

## 3. Android app (optional — Capacitor)
The project is Capacitor-ready (`android/`, `capacitor.config.ts`).

1. Set the production web URL / build in `capacitor.config.ts`.
2. `npm run build && npx cap sync android`
3. `npx cap open android` → build a signed release in Android Studio.
4. Upload the AAB to Google Play Console.
- PWA install already works from the hosted site (`manifest.json` + service
  worker are present) if you don't want the Play Store yet.

---

## 4. Go-live checklist
- [ ] `JWT_SECRET` is long and random (not the example).
- [ ] `ADMIN_MOBILES` set to the real owner number(s) only.
- [ ] `CORS_ORIGIN` locked to the frontend domain.
- [ ] OTP provider live and tested on a real phone (or Firebase test numbers).
- [ ] Backend on a **persistent disk**; take a first DB backup.
- [ ] HTTPS on both (Render/Netlify give it automatically).
- [ ] Product images: for real use, move from base64 to hosted URLs
      (Cloudinary/Firebase Storage) to keep the DB small.
- [ ] Add rate-limiting on `/auth/*` (e.g. `express-rate-limit`) to prevent OTP
      abuse — recommended before public launch.
- [ ] Verify the full flow on production: signup → order → admin accept → pay →
      customer sees status.

---

## 5. Recommended next hardening (post-launch)
- `express-rate-limit` on auth routes.
- Structured logging + error monitoring (Sentry).
- DB backups (cron dumping `roti.db`, or managed Postgres).
- Move OTP to Firebase test numbers off; monitor SMS spend.
- Websockets or short polling so admin/customer see each other's changes live
  (currently a `reload()` / manual refresh).
