# Roti & More

Full production build of the Roti & More food ordering app: one Android app for both
customers and admins, plus its backend API.

## Structure

```
mobile-app/    React Native (Expo) Android app — customer AND admin (role-based tabs)
backend/       Node + Express + Postgres API — auth, products, orders, payments, notifications
docs/          Reference material from the original design handoff (screenshots, notes)
QA.md          Testing status: what's verified, how, and what's still outstanding
```

## Stack

- **App**: React Native / Expo, one APK for both roles, built to a signed `.aab` via EAS
  (free cloud builds). The mobile number you log in with decides what you see — numbers
  in the backend's `ADMIN_MOBILES` allowlist land on the admin tabs
  (Dashboard/Orders/Products/Customers/Alerts) instead of the customer ones.
- **Backend**: Node.js + Express, Postgres (Supabase/Neon free tier), JWT auth
- **OTP login**: Firebase Phone Auth (client) verified server-side via Firebase Admin SDK
- **Push notifications**: Firebase Cloud Messaging (both directions: user ↔ admin)
- **Hosting**: Render (backend, free tier)

## Build roadmap

1. ~~Repo cleanup & project structure~~ ✅
2. ~~Backend: migrate to Postgres, wire Firebase OTP verification, test locally~~ ✅
3. ~~Mobile app: connect every screen to the real API~~ ✅
4. ~~Push notifications (FCM), both directions~~ ✅
5. ~~Admin experience (role-based tabs in the same app)~~ ✅
6. ~~Testing (backend tests, manual QA, security pass)~~ ✅ — see `QA.md`
7. Release: signed `.aab`, Play Console listing, submission

Each phase is documented with setup/run/test instructions as it's completed.
