# Roti & More

Full production build of the Roti & More food ordering app: mobile app, backend API, and admin dashboard.

## Structure

```
mobile-app/    React Native (Expo) Android/iOS app — customer-facing
backend/       Node + Express + Postgres API — auth, products, orders, payments, notifications
admin-web/     React admin dashboard — manage products, orders, customers, notifications
docs/          Reference material from the original design handoff (screenshots, notes)
```

## Stack

- **Mobile app**: React Native / Expo, built to a signed `.aab` via EAS (free cloud builds)
- **Backend**: Node.js + Express, Postgres (Supabase/Neon free tier), JWT auth
- **OTP login**: Firebase Phone Auth (client) verified server-side via Firebase Admin SDK
- **Push notifications**: Firebase Cloud Messaging (both directions: user ↔ admin)
- **Admin dashboard**: React (Vite), same backend API
- **Hosting**: Render (backend, free tier), Vercel/Netlify (admin dashboard, free tier)

## Build roadmap

1. ~~Repo cleanup & project structure~~ ✅
2. ~~Backend: migrate to Postgres, wire Firebase OTP verification, test locally~~ ✅
3. ~~Mobile app: connect every screen to the real API~~ ✅
4. ~~Push notifications (FCM), both directions~~ ✅
5. ~~Admin web dashboard~~ ✅
6. Testing (backend tests, manual QA, security pass)
7. Release: signed `.aab`, Play Console listing, submission

Each phase is documented with setup/run/test instructions as it's completed.
