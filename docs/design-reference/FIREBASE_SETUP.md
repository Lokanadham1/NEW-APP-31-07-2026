# Firebase setup — Roti & More (no server)

Do these once in the Firebase console. ~20 minutes, all in the browser.

## 1. Create the project
1. Go to **https://console.firebase.google.com** → **Add project**.
2. Name it (e.g. "roti-and-more"), accept defaults, create.

## 2. Add a Web app (gives you the config keys)
1. Project overview → click the **</>** (Web) icon → register app (nickname
   "Roti & More web"). Skip Hosting for now.
2. Copy the `firebaseConfig` values. Put them in `roti-and-more-app/.env`:
   ```
   VITE_FB_API_KEY=...
   VITE_FB_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FB_PROJECT_ID=your-project
   VITE_FB_STORAGE_BUCKET=your-project.appspot.com
   VITE_FB_APP_ID=...
   ```

## 3. Turn on Phone login
1. Build → **Authentication** → **Get started**.
2. **Sign-in method** → **Phone** → Enable → Save.
3. **Settings → Authorized domains** → add `localhost` (dev) and later your
   live domain.
4. (For testing without spending SMS) **Phone numbers for testing** → add
   `+919876543210` with code `123456`. Do this for your admin test number too.

## 4. Create the database
1. Build → **Firestore Database** → **Create database** → Start in
   **production mode** → pick a location (e.g. asia-south1 Mumbai) → Enable.
2. Go to the **Rules** tab → paste the contents of
   `firebase-app/firestore.rules` → **Publish**.

## 5. Add your admin number (the allowlist)
1. Firestore → **Start collection** → collection id `admins`.
2. Add a document whose **Document ID is your admin phone in +91 form**, e.g.
   `+919876543210`. Leave fields empty (add a dummy field if it insists, e.g.
   `note: "owner"`).
3. Anyone logging in with that number becomes admin automatically. Add more
   docs for more admins.

## 6. Seed products (first items)
Firestore → create collection `products` → add a few documents with fields
`name, price, description, category, status` (see
`firebase-app/firestore-structure.md`). Or add them later from the app's
Products screen once you log in as admin.

## 7. (Optional) Product images
Build → **Storage** → Get started → keep default rules for now. The Products
screen can upload images; store the returned URL in the product's `imageUrl`.

## 8. Wire the app code
Copy into your app:
```
firebase-app/src/firebase/config.ts  -> roti-and-more-app/src/firebase/config.ts
firebase-app/src/firebase/auth.tsx   -> roti-and-more-app/src/firebase/auth.tsx
firebase-app/src/firebase/data.ts    -> roti-and-more-app/src/firebase/data.ts
firebase-app/src/app/LoginFlow.tsx   -> roti-and-more-app/src/app/LoginFlow.tsx
```
Install the SDK (in the app folder): `npm install firebase`

Then follow `firebase-app/APP_INTEGRATION.md` to connect `App.tsx`.

## Test numbers to use
- Customer: `9876543210` (add as a test number, code `123456`)
- Admin: whatever you put in `admins/` (also add as a test number)
