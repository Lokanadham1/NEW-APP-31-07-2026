import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import StatusPill from '../components/StatusPill';

export default function CustomerDetailPage() {
  const { mobile } = useParams();
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setCustomer(await api.get(`/customers/${mobile}`));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [mobile]);

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!customer) return null;

  return (
    <div>
      <Link to="/customers" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700 }}>&larr; All customers</Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '10px 0 20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>{customer.name}</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>{customer.customerId} · {customer.mobile}</p>
          <p className="muted" style={{ margin: '4px 0 0' }}>{customer.address}</p>
        </div>
        <Link to={`/notifications?to=${customer.userId}`} className="btn btn-outline">Message this customer</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div className="muted" style={{ fontSize: 12 }}>Total purchased</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>₹{customer.totalPurchase}</div>
        </div>
        <div className="card">
          <div className="muted" style={{ fontSize: 12 }}>Total paid</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>₹{customer.totalPaid}</div>
        </div>
        <div className="card">
          <div className="muted" style={{ fontSize: 12 }}>Pending balance</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: customer.pending > 0 ? 'var(--danger)' : 'var(--primary)' }}>
            ₹{customer.pending}
          </div>
        </div>
      </div>

      <h3>Orders</h3>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {customer.orders.length === 0 ? (
          <p style={{ padding: 20 }} className="muted">No orders yet.</p>
        ) : (
          <table>
            <thead><tr><th>Order</th><th>Delivery</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {customer.orders.map((o) => (
                <tr key={o.id}>
                  <td><Link to={`/orders/${o.id}`}>#{o.id}</Link></td>
                  <td>{o.deliveryDate} · {o.deliveryTime}</td>
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
