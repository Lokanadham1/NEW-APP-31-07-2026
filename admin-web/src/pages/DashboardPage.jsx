import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import StatusPill from '../components/StatusPill';

export default function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [o, c] = await Promise.all([api.get('/orders'), api.get('/customers')]);
        setOrders(o);
        setCustomers(c);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="error-text">{error}</p>;

  const pending = orders.filter((o) => o.status === 'pending');
  const approved = orders.filter((o) => o.status === 'approved');
  const totalPending = customers.reduce((s, c) => s + c.pending, 0);
  const recent = [...orders].slice(0, 8);

  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Pending orders" value={pending.length} highlight={pending.length > 0} />
        <StatCard label="Approved (in progress)" value={approved.length} />
        <StatCard label="Customers" value={customers.length} />
        <StatCard label="Outstanding balance" value={`₹${totalPending}`} highlight={totalPending > 0} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Recent orders</h3>
        <Link to="/orders" style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>View all</Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {recent.length === 0 ? (
          <p style={{ padding: 20 }} className="muted">No orders yet.</p>
        ) : (
          <table>
            <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <td><Link to={`/orders/${o.id}`}>#{o.id}</Link></td>
                  <td>{o.customerName}</td>
                  <td>₹{o.total}</td>
                  <td><StatusPill status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div className="card">
      <div className="muted" style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: highlight ? 'var(--gold-dark)' : 'var(--ink)' }}>{value}</div>
    </div>
  );
}
