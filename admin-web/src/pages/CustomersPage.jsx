import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (query) => {
    setLoading(true);
    setError('');
    try {
      setCustomers(await api.get(`/customers${query ? `?q=${encodeURIComponent(query)}` : ''}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(''); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    load(q);
  };

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Customers</h1>
      <p className="muted" style={{ marginTop: 0 }}>{customers.length} customer{customers.length !== 1 ? 's' : ''}</p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 18, maxWidth: 360 }}>
        <input className="input" placeholder="Search by name, mobile, or customer ID" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-outline" type="submit">Search</button>
      </form>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: 20 }} className="muted">Loading…</p>
        ) : customers.length === 0 ? (
          <p style={{ padding: 20 }} className="muted">No customers found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Mobile</th><th>Orders</th><th>Purchased</th><th>Pending</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.userId}>
                  <td><Link to={`/customers/${c.mobile}`}>{c.customerId}</Link></td>
                  <td>{c.name}</td>
                  <td>{c.mobile}</td>
                  <td>{c.orderCount}</td>
                  <td>₹{c.totalPurchase}</td>
                  <td style={c.pending > 0 ? { color: 'var(--danger)', fontWeight: 700 } : undefined}>₹{c.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
