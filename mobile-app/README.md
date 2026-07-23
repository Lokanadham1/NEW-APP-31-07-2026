# Roti & More — Android App

A React Native (Expo) catering order app, styled with your CJ / Roti & More
crest logo (forest green + gold on cream). Talks to the real backend in
`../backend` — mobile-OTP login, live product catalog, order placement with
admin approval, payment tracking, and notifications.

## What's included

- **Splash screen** — restores your session and routes you straight to Home,
  profile setup, or Login depending on what's saved.
- **Login** — mobile number + OTP (via the backend's `/auth/request-otp` /
  `/auth/verify-otp`; swaps to Firebase Phone Auth once wired, see below).
- **Profile setup** — name, catering/business name, delivery address
  (required once before you can order — matches the backend's `profile_done`
  gate).
- **Home** — greeting, search, categories and menu pulled live from
  `GET /products`.
- **Menu** — browse by category.
- **Item detail** — quantity selector, add to cart, shows out-of-stock items.
- **Cart** — edit quantities, running subtotal.
- **Checkout** — pick a delivery date/time slot, optional notes, places the
  order via `POST /orders` (no online payment — Roti & More collects payment
  separately and records it in the admin dashboard).
- **Orders** — live status (pending/approved/completed/rejected/cancelled),
  tap into an order to cancel (within 6h while pending), reschedule (once),
  or edit the delivery address (once) — all backed by the real API.
- **Notifications** — order updates from Roti & More, mark read / mark all read.
- **Profile** — real account info, edit profile, logout.

## 1. Run it locally

You'll need [Node.js](https://nodejs.org) (LTS) and the backend running
(see `../backend/README.md`) — the app has nothing to talk to without it.

```bash
cd mobile-app
npm install
cp .env.example .env      # set EXPO_PUBLIC_API_URL — see comments in the file
npx expo start
```

This prints a QR code. Install the **Expo Go** app from the Play Store on
your Android phone, scan the QR code, and the app opens live on your device.
Any code changes reload instantly.

- **Android emulator**: the default `.env.example` value
  (`http://10.0.2.2:4000`) already points at your computer's localhost.
- **Physical phone via Expo Go**: your phone and computer must be on the
  same Wi-Fi; set `EXPO_PUBLIC_API_URL` to your computer's LAN IP instead
  (e.g. `http://192.168.1.50:4000`).
- **Testing OTP without paying for SMS**: leave the backend's
  `OTP_PROVIDER` empty (dev mode). The Login screen shows the generated code
  on-screen so you can log in without a real text message.

## 2. Swapping in Firebase Phone Auth (production OTP)

The backend already has `POST /auth/firebase` ready to verify Firebase ID
tokens (see `backend/DEPLOYMENT.md` steps 1–2 to create the Firebase
project). Wiring the mobile side requires:

1. Add an Android app to your Firebase project with package name
   `com.rotiandmore.app`, download `google-services.json` into `mobile-app/`.
2. Install `@react-native-firebase/app` + `@react-native-firebase/auth` (this
   requires an EAS **development build**, not Expo Go, since it adds native
   code) and register your app's SHA-1/SHA-256 fingerprints in the Firebase
   console for Play Integrity.
3. In `LoginScreen.js`, replace the `requestOtp`/`verifyOtp` calls with the
   Firebase Auth `signInWithPhoneNumber` flow, then POST the resulting ID
   token to `/auth/firebase` instead of `/auth/verify-otp`.

This is a separate step because it depends on your Firebase project
existing first — the dev-mode OTP flow above is fully functional in the
meantime for testing everything else end-to-end.

## 3. Customize before publishing

- **App name / package ID**: edit `app.json` → `expo.name` and
  `expo.android.package` (must be unique, reverse-domain style). You cannot
  change the package ID after your first Play Store upload, so pick it
  carefully.
- **Menu & prices**: managed from the backend/admin dashboard, not in the
  app — add products via `POST /products` (or the admin dashboard once built).
- **Colors**: `src/theme/colors.js` (already set from your logo).
- **Icon/splash image**: replace the files in `assets/` (same filenames) if
  you want a different icon than the crest logo.

## 4. Build a real Android app file (AAB) to upload to Google Play

Google requires an **Android App Bundle (.aab)**, not just an APK, for new
Play Store apps. The easiest way to produce one without installing Android
Studio is Expo's free cloud build service, **EAS Build**:

```bash
npm install -g eas-cli
eas login          # create a free Expo account if you don't have one
eas build:configure
eas build -p android --profile production
```

This uploads your project to Expo's servers, builds the `.aab` in the cloud,
and gives you a download link when it's done (usually 10–20 minutes). No
Mac, no Android Studio, no local Android SDK required.

Set `EXPO_PUBLIC_API_URL` to your **production** backend URL before running
this (either in `.env` or via `eas.json` build profile env vars) — otherwise
the built app will try to talk to your local dev machine.

(If you'd rather build locally with Android Studio, `npx expo prebuild`
generates a native `android/` folder you can open and build with Gradle
directly.)

## 5. Publish to Google Play Console

1. Create a [Google Play Console](https://play.google.com/console) developer
   account (one-time $25 fee).
2. Create a new app, fill in your store listing: app name, short/full
   description, screenshots, category (Food & Drink), and your **privacy
   policy URL** — Google requires this even for simple apps.
3. Under **Production → Create new release**, upload the `.aab` file from
   step 4.
4. Complete the required Data Safety form, content rating questionnaire, and
   target audience section.
5. Submit for review. First-time app reviews typically take a few hours to
   a few days.

(Full guided steps for this land in the release phase of the project.)

## Project structure

```
mobile-app/
├── App.js                        # entry point — wraps providers
├── app.json                      # Expo/Android config (name, package id, icons)
├── eas.json                      # cloud build config
├── assets/                       # logo/icon/splash images
└── src/
    ├── config.js                 # API_URL (from EXPO_PUBLIC_API_URL)
    ├── api/client.js             # fetch wrapper, attaches JWT, error handling
    ├── theme/                    # colors, spacing, category icons
    ├── context/
    │   ├── AuthContext.js        # session, OTP login, profile
    │   ├── ProductsContext.js    # live product catalog
    │   └── CartContext.js        # in-progress cart (local only)
    ├── navigation/AppNavigator.js
    ├── components/                # reusable UI (buttons, cards, header)
    └── screens/                   # one file per screen
```
