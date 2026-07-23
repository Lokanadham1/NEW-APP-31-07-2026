// db.js — SQLite schema + helpers. Uses better-sqlite3 (synchronous, zero-config).
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(process.env.DB_PATH || path.join(__dirname, 'roti.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  mobile        TEXT UNIQUE NOT NULL,
  customer_id   TEXT UNIQUE,                 -- CUS0001 etc (customers only)
  role          TEXT NOT NULL DEFAULT 'user',-- 'user' | 'admin'
  name          TEXT,
  catering_name TEXT,
  address       TEXT,
  profile_done  INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS otps (
  mobile     TEXT PRIMARY KEY,
  code       TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  price       REAL NOT NULL,
  description TEXT,
  category    TEXT,
  status      TEXT NOT NULL DEFAULT 'available', -- 'available' | 'out_of_stock'
  image_url   TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id                INTEGER PRIMARY KEY,       -- 4-digit id, matches app
  user_id           INTEGER NOT NULL,
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
  address_edit_used INTEGER NOT NULL DEFAULT 0,
  reschedule_used   INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL,   -- 0 = admin broadcast
  message      TEXT NOT NULL,
  read         INTEGER NOT NULL DEFAULT 0,
  created_date TEXT NOT NULL,
  created_at   TEXT NOT NULL
);
`);

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

module.exports = { db, mapProduct, mapOrder, mapUser, mapNotif };
