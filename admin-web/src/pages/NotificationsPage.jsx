import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

export default function NotificationsPage() {
  const [searchParams] = useSearchParams();
  const preselect = searchParams.get('to');

  const [notifications, setNotifications] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [recipient, setRecipient] = useState(preselect || 'all');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [notifs, custs] = await Promise.all([
          api.get('/notifications'),
          api.get('/customers'),
        ]);
        setNotifications(notifs);
        setCustomers(custs);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    setSentMsg('');
    try {
      const body = { message: message.trim() };
      if (recipient !== 'all') body.userId = Number(recipient);
      const res = await api.post('/notifications/send', body);
      setSentMsg(recipient === 'all' ? `Sent to ${res.sentTo} customer${res.sentTo !== 1 ? 's' : ''}.` : 'Sent.');
      setMessage('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>Notifications</h1>

      <form className="card" onSubmit={handleSend} style={{ maxWidth: 480, marginBottom: 28 }}>
        <h3 style={{ margin: '0 0 4px' }}>Send a message</h3>
        <p className="muted" style={{ margin: '0 0 4px', fontSize: 13 }}>
          Delivered as an in-app notification, and as a push if the customer's device is registered.
        </p>

        <label className="field-label">To</label>
        <select className="input" value={recipient} onChange={(e) => setRecipient(e.target.value)}>
          <option value="all">All customers</option>
          {customers.map((c) => (
            <option key={c.userId} value={c.userId}>{c.name} · {c.mobile}</option>
          ))}
        </select>

        <label className="field-label">Message</label>
        <textarea className="input" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} required />

        {error ? <p className="error-text" style={{ marginTop: 10 }}>{error}</p> : null}
        {sentMsg ? <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 13, marginTop: 10 }}>{sentMsg}</p> : null}

        <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={sending || !message.trim()}>
          {sending ? 'Sending…' : recipient === 'all' ? 'Broadcast to all customers' : 'Send'}
        </button>
      </form>

      <h3>Activity</h3>
      <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
        Automatic notifications from customer actions — new orders, cancellations, reschedules, address changes.
      </p>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: 20 }} className="muted">Loading…</p>
        ) : notifications.length === 0 ? (
          <p style={{ padding: 20 }} className="muted">Nothing yet.</p>
        ) : (
          <table>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id}>
                  <td style={{ width: '75%' }}>{n.message}</td>
                  <td className="muted" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{n.createdDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
