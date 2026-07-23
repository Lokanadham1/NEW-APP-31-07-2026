# Roti & More — Android App

A complete, ready-to-build React Native (Expo) food ordering app, styled with
your CJ / Roti & More crest logo (forest green + gold on cream).

## What's included

Full source for a real, working app — not a mockup:

- **Splash screen** with your logo
- **Login** (name + phone, local demo auth — swap in real auth later)
- **Home** — greeting, search, categories, popular dishes
- **Menu** — browse by category (Rotis, Curries, Rice/Biryani, Starters, Drinks, Desserts)
- **Item detail** — quantity selector, add to cart
- **Cart** — edit quantities, subtotal/delivery/total
- **Checkout** — delivery address, payment method choice, place order
- **Order success** + **Order history / tracking**
- **Profile** — account info, settings menu, logout
- Bottom tab navigation, consistent green/gold theme throughout

All data (menu items, prices) is demo data in `src/data/menuData.js` — edit
this file to reflect your real menu, or wire it up to a backend later (see
"Going live" below).

## 1. Run it locally (test on your own phone in minutes)

You'll need [Node.js](https://nodejs.org) (LTS) installed on your computer.

```bash
cd roti-and-more
npm install
npx expo start
```

This prints a QR code. Install the **Expo Go** app from the Play Store on
your Android phone, scan the QR code, and the app opens live on your device.
Any code changes you make will reload instantly.

## 2. Customize before publishing

- **App name / package ID**: edit `app.json` → `expo.name` and
  `expo.android.package` (must be unique, reverse-domain style, e.g.
  `com.yourcompany.rotiandmore`). You cannot change the package ID after
  your first Play Store upload, so pick it carefully.
- **Menu & prices**: `src/data/menuData.js`
- **Colors**: `src/theme/colors.js` (already set from your logo)
- **Icon/splash image**: replace the files in `assets/` (same filenames) if
  you want a different icon than the crest logo.

## 3. Build a real Android app file (AAB) to upload to Google Play

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

(If you'd rather build locally with Android Studio, `npx expo prebuild`
generates a native `android/` folder you can open and build with Gradle
directly — useful if you want full native control later.)

## 4. Publish to Google Play Console

1. Create a [Google Play Console](https://play.google.com/console) developer
   account (one-time $25 fee).
2. Create a new app, fill in your store listing: app name, short/full
   description, screenshots (take these from Expo Go or a built APK),
   category (Food & Drink), and your **privacy policy URL** — Google
   requires this even for simple apps; a free one-page policy generator
   works fine to start.
3. Under **Production → Create new release**, upload the `.aab` file from
   step 3.
4. Complete the required Data Safety form, content rating questionnaire, and
   target audience section.
5. Submit for review. First-time app reviews typically take a few hours to
   a few days.

## 5. Going live for real (optional next steps)

Right now orders, login, and the menu use local/demo data so you can test
and publish quickly. When you're ready to take real orders, you'll want:

- A backend (e.g. Firebase, Supabase, or a custom API) for the menu, orders,
  and accounts
- Real authentication (OTP/SMS or email)
- A payment gateway (Razorpay, PayU, Stripe, etc. — required for UPI/card
  payments in India)
- Push notifications for order status updates

I'm happy to help wire any of these up — just let me know which one you
want first (this determines how much extra setup, like paid services or
API keys, will be needed).

## Project structure

```
roti-and-more/
├── App.js                     # entry point
├── app.json                   # Expo/Android config (name, package id, icons)
├── eas.json                   # cloud build config
├── assets/                    # logo/icon/splash images
└── src/
    ├── theme/colors.js        # brand colors, spacing, type scale
    ├── data/menuData.js       # menu items & categories (demo data)
    ├── context/CartContext.js # cart + order state
    ├── navigation/AppNavigator.js
    ├── components/            # reusable UI (buttons, cards, header)
    └── screens/                # one file per screen
```
