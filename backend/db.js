// db.js — Postgres schema + helpers. Uses `pg` (async). Works with any
// standard Postgres connection string (Supabase, Neon, Render Postgres, local).
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
}

// Managed Postgres providers (Supabase/Neon/Render) require SSL but use
// certificates not in Node's default trust store — safe to relax verification
// for the DB connection itself (the connection string still requires a valid
// password). Local Postgres (DATABASE_URL containing localhost/127.0.0.1)
// doesn't need SSL at all.
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

async function query(text, params) {
  return pool.query(text, params);
}

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      mobile        TEXT UNIQUE NOT NULL,
      customer_id   TEXT UNIQUE,                 -- CUS0001 etc (customers only)
      role          TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin'
      name          TEXT,
      catering_name TEXT,
      address       TEXT,
      profile_done  BOOLEAN NOT NULL DEFAULT FALSE,
      created_at    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS otps (
      mobile     TEXT PRIMARY KEY,
      code       TEXT NOT NULL,
      expires_at BIGINT NOT NULL,
      attempts   INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      price       REAL NOT NULL,
      description TEXT,
      category    TEXT,
      status      TEXT NOT NULL DEFAULT 'available', -- 'available' | 'out_of_stock'
      image_url   TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id                INTEGER PRIMARY KEY,       -- 4-digit id, matches app
      user_id           INTEGER NOT NULL REFERENCES users(id),
      customer_name     TEXT NOT NULL,
      customer_mobile   TEXT NOT NULL,
      customer_address  TEXT NOT NULL,
      items_json        TEXT NOT NULL,             -- [{productId,name,price,quantity}]
      subtotal          REAL NOT NULL,
      gst               REAL NOT NULL DEFAULT 0,
      delivery          REAL NOT NULL DEFAULT 0,
      total             REAL NOT NULL,
      status            TEXT NOT NULL DEFAULT 'pending', -- pending|approved|completed|rejected|cancelled
      created_date      TEXT NOT NULL,
      created_at        TEXT NOT NULL,
      delivery_date     TEXT,
      delivery_time     TEXT,
      remarks           TEXT,
      contact_person    TEXT,
      paid_amount       REAL NOT NULL DEFAULT 0,
      payments_json     TEXT NOT NULL DEFAULT '[]',
      address_edit_used BOOLEAN NOT NULL DEFAULT FALSE,
      reschedule_used   BOOLEAN NOT NULL DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id           SERIAL PRIMARY KEY,
      user_id      INTEGER NOT NULL,   -- 0 = admin broadcast
      message      TEXT NOT NULL,
      read         BOOLEAN NOT NULL DEFAULT FALSE,
      created_date TEXT NOT NULL,
      created_at   TEXT NOT NULL
    );
  `);
}

// ─── Row → API shape mappers ────────────────────────────────────────────────
const mapProduct = (r) => r && ({
  id: r.id, name: r.name, price: r.price, description: r.description,
  category: r.category, status: r.status, imageUrl: r.image_url || undefined,
});

const mapOrder = (r) => r && ({
  id: r.id, userId: r.user_id, customerName: r.customer_name,
  customerMobile: r.customer_mobile, customerAddress: r.customer_address,
  items: JSON.parse(r.items_json), subtotal: r.subtotal, gst: r.gst,
  delivery: r.delivery, total: r.total, status: r.status,
  createdDate: r.created_date, createdAt: r.created_at,
  deliveryDate: r.delivery_date, deliveryTime: r.delivery_time,
  remarks: r.remarks, contactPerson: r.contact_person,
  paidAmount: r.paid_amount, payments: JSON.parse(r.payments_json),
  addressEditUsed: !!r.address_edit_used, rescheduleUsed: !!r.reschedule_used,
});

const mapUser = (r) => r && ({
  id: r.id, mobile: r.mobile, customerId: r.customer_id, role: r.role,
  name: r.name, cateringName: r.catering_name, address: r.address,
  profileDone: !!r.profile_done,
});

const mapNotif = (r) => r && ({
  id: r.id, userId: r.user_id, message: r.message,
  read: !!r.read, createdDate: r.created_date,
});

module.exports = { pool, query, initSchema, mapProduct, mapOrder, mapUser, mapNotif };
