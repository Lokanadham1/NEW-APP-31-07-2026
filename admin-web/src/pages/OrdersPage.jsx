import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import StatusPill from '../components/StatusPill';

const FILTERS = ['all', 'pending', 'approved', 'completed', 'rejected', 'cancelled'];

export default function OrdersPage() {
  const [status, setStatus] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await api.get(`/orders?status=${status}`);
      setOrders(rows);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Orders</h1>
      <p className="muted" style={{ marginTop: 0 }}>{orders.length} order{orders.length !== 1 ? 's' : ''}</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`btn btn-sm ${status === f ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatus(f)}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: 20 }} className="muted">Loading…</p>
        ) : orders.length === 0 ? (
          <p style={{ padding: 20 }} className="muted">No orders here.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Delivery</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link to={`/orders/${o.id}`}>#{o.id}</Link></td>
                  <td>{o.customerName}<br /><span className="muted" style={{ fontSize: 12 }}>{o.customerMobile}</span></td>
                  <td style={{ maxWidth: 220 }}>{o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</td>
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
