# Roti & More — Admin Dashboard

A React (Vite) web app for managing Roti & More: orders, products, customers, and
notifications. Talks to the same backend API as the mobile app (`../backend`).

## What's included

- **Login** — mobile number + OTP, same flow as the mobile app. Only numbers in the
  backend's `ADMIN_MOBILES` allowlist can sign in; the server issues `role: "admin"`
  and this app refuses to store the session if the role isn't admin.
- **Dashboard** — pending/approved order counts, customer count, outstanding balance,
  recent orders.
- **Orders** — filter by status, open an order to accept/reject/mark delivered,
  reschedule, record a payment, view the bill payload.
- **Products** — add/edit/delete menu items, including a photo upload (stored as a
  data URL via the backend's existing `imageUrl` field — no third-party image host
  needed to get started).
- **Customers** — search, view purchase/payment totals and order history per customer.
- **Notifications** — send a message to one customer or broadcast to all of them
  (delivered as an in-app notification and, once push is configured, an FCM push);
  also shows the automatic activity log (new orders, cancellations, reschedules,
  address changes).

## 1. Run it locally

You'll need [Node.js](https://nodejs.org) (LTS) and the backend running
(see `../backend/README.md`).

```bash
cd admin-web
npm install
cp .env.example .env.local     # set VITE_API_URL — see comments in the file
npm run dev
```

Opens at `http://localhost:5173`. Sign in with a mobile number listed in the
backend's `ADMIN_MOBILES`. In dev mode (no `OTP_PROVIDER` set on the backend) the
code is shown on-screen — no real SMS needed to test.

## 2. Deploy (Vercel or Netlify — both free)

Vercel:
1. Vercel → **Add New → Project** → import this repo, set the project **root
   directory** to `admin-web`.
2. Build command: `npm run build` · Output directory: `dist` (Vercel auto-detects
   Vite, these are the defaults).
3. Environment variable: `VITE_API_URL` = your deployed backend URL.
4. Deploy. Then add the resulting domain to the backend's `CORS_ORIGIN`
   (comma-separated if you also have the mobile app calling it) and redeploy the
   backend.

Netlify steps are equivalent: root directory `admin-web`, build command
`npm run build`, publish directory `dist`, same `VITE_API_URL` env var.

## Project structure

```
admin-web/
├── index.html
├── vite.config.js
├── public/logo.png
└── src/
    ├── config.js              # API_URL (from VITE_API_URL)
    ├── api/client.js          # fetch wrapper, attaches JWT, error handling
    ├── theme.css               # brand colors, shared component styles
    ├── context/AuthContext.jsx # session, OTP login, admin-role gate
    ├── components/
    │   ├── Layout.jsx          # sidebar nav + page shell
    │   ├── ProtectedRoute.jsx
    │   └── StatusPill.jsx
    └── pages/
        ├── LoginPage.jsx
        ├── DashboardPage.jsx
        ├── OrdersPage.jsx / OrderDetailPage.jsx
        ├── ProductsPage.jsx
        ├── CustomersPage.jsx / CustomerDetailPage.jsx
        └── NotificationsPage.jsx
```
