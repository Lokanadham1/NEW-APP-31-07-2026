import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import StatusPill from '../components/StatusPill';

const TIME_SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('Cash');
  const [txnId, setTxnId] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const o = await api.get(`/orders/${orderId}`);
      setOrder(o);
      setNewDate(o.deliveryDate || '');
      setNewTime(o.deliveryTime || '');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
      setRescheduleOpen(false);
      setPaymentOpen(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="muted">Loading…</p>;
  if (error && !order) return <p className="error-text">{error}</p>;
  if (!order) return null;

  const balance = Math.max(0, order.total - order.paidAmount);

  return (
    <div>
      <Link to="/orders" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700 }}>&larr; All orders</Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '10px 0 20px' }}>
        <h1 style={{ margin: 0 }}>Order #{order.id}</h1>
        <StatusPill status={order.status} />
      </div>

      {error ? <p className="error-text" style={{ marginBottom: 14 }}>{error}</p> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <h3 style={styles.cardTitle}>Customer</h3>
          <p style={styles.line}>{order.customerName} · {order.customerMobile}</p>
          <p className="muted" style={styles.lineMuted}>{order.customerAddress}</p>
          {order.contactPerson ? <p className="muted" style={styles.lineMuted}>Contact: {order.contactPerson}</p> : null}
        </div>

        <div className="card">
          <h3 style={styles.cardTitle}>Delivery</h3>
          <p style={styles.line}>{order.deliveryDate} at {order.deliveryTime}</p>
          {order.remarks ? <p className="muted" style={styles.lineMuted}>Note: {order.remarks}</p> : null}
          {order.rescheduleUsed ? <p className="muted" style={styles.lineMuted}>Customer has already used their one reschedule.</p> : null}
        </div>

        <div className="card">
          <h3 style={styles.cardTitle}>Items</h3>
          {order.items.map((it, idx) => (
            <div key={idx} style={styles.itemRow}>
              <span>{it.quantity}× {it.name}</span>
              <span>₹{it.price * it.quantity}</span>
            </div>
          ))}
          <div style={{ ...styles.itemRow, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 6, fontWeight: 800 }}>
            <span>Total</span>
            <span>₹{order.total}</span>
          </div>
        </div>

        <div className="card">
          <h3 style={styles.cardTitle}>Payment</h3>
          <p style={styles.line}>Paid ₹{order.paidAmount} of ₹{order.total}</p>
          {balance > 0 ? (
            <p className="muted" style={styles.lineMuted}>Balance due: ₹{balance}</p>
          ) : (
            <p style={{ ...styles.lineMuted, color: 'var(--primary)', fontWeight: 700 }}>Fully paid</p>
          )}
          {order.payments.map((p, idx) => (
            <p key={idx} className="muted" style={{ fontSize: 12.5, margin: '4px 0' }}>
              ₹{p.amount} · {p.mode} · {p.date}{p.transactionId ? ` · ${p.transactionId}` : ''}
            </p>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        {order.status === 'pending' && (
          <>
            <button className="btn btn-primary" disabled={busy} onClick={() => run(() => api.post(`/orders/${orderId}/accept`))}>
              Accept order
            </button>
            <button className="btn btn-danger" disabled={busy} onClick={() => {
              if (confirm('Reject this order?')) run(() => api.post(`/orders/${orderId}/reject`));
            }}>
              Reject order
            </button>
          </>
        )}
        {order.status === 'approved' && (
          <button className="btn btn-primary" disabled={busy} onClick={() => run(() => api.post(`/orders/${orderId}/deliver`))}>
            Mark delivered
          </button>
        )}
        {['pending', 'approved'].includes(order.status) && (
          <button className="btn btn-outline" disabled={busy} onClick={() => setRescheduleOpen((v) => !v)}>
            Reschedule
          </button>
        )}
        {balance > 0 && (
          <button className="btn btn-outline" disabled={busy} onClick={() => setPaymentOpen((v) => !v)}>
            Record payment
          </button>
        )}
        <a className="btn btn-outline" href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/orders/${orderId}/bill`} target="_blank" rel="noreferrer">
          View bill JSON
        </a>
      </div>

      {rescheduleOpen && (
        <div className="card" style={{ marginTop: 16, maxWidth: 420 }}>
          <h3 style={styles.cardTitle}>New delivery date & time</h3>
          <label className="field-label">Date</label>
          <input type="date" className="input" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          <label className="field-label">Time</label>
          <select className="input" value={newTime} onChange={(e) => setNewTime(e.target.value)}>
            {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            disabled={busy || !newDate || !newTime}
            onClick={() => run(() => api.post(`/orders/${orderId}/reschedule`, { deliveryDate: newDate, deliveryTime: newTime }))}
          >
            Confirm reschedule
          </button>
        </div>
      )}

      {paymentOpen && (
        <div className="card" style={{ marginTop: 16, maxWidth: 420 }}>
          <h3 style={styles.cardTitle}>Record a payment (balance ₹{balance})</h3>
          <label className="field-label">Amount</label>
          <input className="input" type="number" min="1" max={balance} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <label className="field-label">Mode</label>
          <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option>Cash</option>
            <option>UPI</option>
            <option>Card</option>
            <option>Bank Transfer</option>
          </select>
          <label className="field-label">Transaction ID (optional)</label>
          <input className="input" value={txnId} onChange={(e) => setTxnId(e.target.value)} />
          <label className="field-label">Note (optional)</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            disabled={busy || !amount || Number(amount) <= 0}
            onClick={() => run(() => api.post(`/orders/${orderId}/payments`, {
              amount: Number(amount), mode, transactionId: txnId || undefined, note: note || undefined,
            }))}
          >
            Save payment
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  cardTitle: { margin: '0 0 10px', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.03, color: 'var(--slate)' },
  line: { margin: '2px 0', fontWeight: 600, fontSize: 14 },
  lineMuted: { margin: '2px 0', fontSize: 13 },
  itemRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13.5, padding: '3px 0' },
};
