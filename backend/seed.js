// seed.js — populate products + a few demo orders/customers. Run once: `npm run seed`.
require('dotenv').config();
const { query, initSchema } = require('./db');
const { findOrCreateUser } = require('./auth');

async function main() {
  await initSchema();

  const now = new Date().toISOString();
  const today = now.split('T')[0];

  await query('DELETE FROM push_tokens');
  await query('DELETE FROM orders');
  await query('DELETE FROM products');
  await query('DELETE FROM notifications');
  await query('DELETE FROM users');
  await query('DELETE FROM otps');

  // products
  const prods = [
    ['Poli', 30, 'Sweet lentil stuffed flatbread, golden & crisp', 'Flatbreads', 'available'],
    ['Chapathi', 10, 'Soft whole wheat flatbread, freshly made', 'Flatbreads', 'available'],
    ['Rumali Roti', 15, 'Paper-thin handkerchief bread, delicately stretched', 'Flatbreads', 'available'],
    ['Bellam Bonda', 15, 'Sweet jaggery fritters, crispy outside, soft inside', 'Snacks', 'available'],
  ];
  for (const p of prods) {
    await query(
      'INSERT INTO products (name,price,description,category,status) VALUES ($1,$2,$3,$4,$5)',
      p
    );
  }

  // demo customers (creates users w/ CUS ids)
  const c1 = await findOrCreateUser('9876543210');
  await query('UPDATE users SET name=$1,catering_name=$2,address=$3,profile_done=true WHERE id=$4',
    ['Ramesh', 'Ramesh Catering', '12, MG Road, Hyderabad', c1.id]);
  const c2 = await findOrCreateUser('9845012345');
  await query('UPDATE users SET name=$1,catering_name=$2,address=$3,profile_done=true WHERE id=$4',
    ['Priya', 'Priya Events', '45, Jubilee Hills, Hyderabad', c2.id]);
  const c3 = await findOrCreateUser('9000112233');
  await query('UPDATE users SET name=$1,catering_name=$2,address=$3,profile_done=true WHERE id=$4',
    ['Suresh', 'Suresh Functions', '8, Film Nagar, Hyderabad', c3.id]);

  const insertOrder = (o) => query(
    `INSERT INTO orders
      (id,user_id,customer_name,customer_mobile,customer_address,items_json,subtotal,gst,delivery,total,
       status,created_date,created_at,delivery_date,delivery_time,remarks,contact_person,paid_amount,payments_json,
       address_edit_used,reschedule_used)
     VALUES ($1,$2,$3,$4,$5,$6,$7,0,0,$8,$9,$10,$11,$12,$13,NULL,$14,$15,$16,false,false)`,
    [o.id, o.user_id, o.customer_name, o.customer_mobile, o.customer_address, o.items_json,
     o.subtotal, o.total, o.status, o.created_date, o.created_at, o.delivery_date, o.delivery_time,
     o.contact_person, o.paid_amount, o.payments_json]
  );

  await insertOrder({ id: 1054, user_id: c1.id, customer_name: 'Ramesh Catering', customer_mobile: '9876543210',
    customer_address: '12, MG Road, Hyderabad',
    items_json: JSON.stringify([{ productId: 1, name: 'Poli', price: 30, quantity: 10 }, { productId: 2, name: 'Chapathi', price: 10, quantity: 20 }]),
    subtotal: 500, total: 500, status: 'pending', created_date: today, created_at: now,
    delivery_date: '2026-07-24', delivery_time: '10:00', contact_person: 'Ramesh', paid_amount: 0, payments_json: '[]' });

  await insertOrder({ id: 1053, user_id: c2.id, customer_name: 'Priya Events', customer_mobile: '9845012345',
    customer_address: '45, Jubilee Hills, Hyderabad',
    items_json: JSON.stringify([{ productId: 1, name: 'Poli', price: 30, quantity: 5 }, { productId: 4, name: 'Bellam Bonda', price: 15, quantity: 10 }]),
    subtotal: 300, total: 300, status: 'approved', created_date: today, created_at: now,
    delivery_date: '2026-07-22', delivery_time: '11:00', contact_person: 'Priya', paid_amount: 150,
    payments_json: JSON.stringify([{ amount: 150, date: today, note: 'Advance', mode: 'UPI', transactionId: 'TXN8821441' }]) });

  await insertOrder({ id: 1052, user_id: c3.id, customer_name: 'Suresh Functions', customer_mobile: '9000112233',
    customer_address: '8, Film Nagar, Hyderabad',
    items_json: JSON.stringify([{ productId: 2, name: 'Chapathi', price: 10, quantity: 30 }, { productId: 3, name: 'Rumali Roti', price: 15, quantity: 20 }]),
    subtotal: 600, total: 600, status: 'completed', created_date: today, created_at: now,
    delivery_date: '2026-07-16', delivery_time: '10:00', contact_person: 'Suresh', paid_amount: 600,
    payments_json: JSON.stringify([{ amount: 600, date: today, note: 'Full', mode: 'Cash', transactionId: '' }]) });

  await query('INSERT INTO notifications (user_id,message,read,created_date,created_at) VALUES (0,$1,false,$2,$3)',
    ['New Order #1054 from Ramesh Catering · ₹500', today, now]);

  console.log('Seeded: 4 products, 3 customers, 3 orders. Admin numbers:', process.env.ADMIN_MOBILES || '(none set)');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
