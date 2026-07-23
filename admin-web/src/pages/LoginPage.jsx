import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSend = /^\d{10}$/.test(phone);
  const canVerify = /^\d{4}$/.test(code);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await requestOtp(phone);
      setDevCode(res.devCode || null);
      setStep('code');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOtp(phone, code);
      navigate('/', { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <form className="card" style={styles.card} onSubmit={step === 'phone' ? handleSendCode : handleVerify}>
        <img src="/logo.png" alt="Roti & More" style={styles.logo} />
        <h1 style={styles.title}>Roti & More Admin</h1>
        <p style={styles.subtitle}>
          {step === 'phone' ? 'Sign in with your admin mobile number' : `Enter the code sent to ${phone}`}
        </p>

        {step === 'phone' ? (
          <>
            <label className="field-label">Mobile number</label>
            <input
              className="input"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              autoFocus
            />
          </>
        ) : (
          <>
            <label className="field-label">Verification code</label>
            <input
              className="input"
              placeholder="0000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              autoFocus
              style={{ fontSize: 20, letterSpacing: 6, textAlign: 'center' }}
            />
            {devCode ? (
              <p style={styles.devHint}>Dev mode — no SMS sent. Your code is {devCode}.</p>
            ) : null}
          </>
        )}

        {error ? <p className="error-text" style={{ marginTop: 14 }}>{error}</p> : null}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || (step === 'phone' ? !canSend : !canVerify)}
          style={{ width: '100%', marginTop: 20, justifyContent: 'center' }}
        >
          {loading ? 'Please wait…' : step === 'phone' ? 'Send code' : 'Verify & sign in'}
        </button>

        {step === 'code' ? (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => { setStep('phone'); setCode(''); setError(''); }}
            style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
          >
            Change number
          </button>
        ) : null}

        <p style={styles.note}>
          Only mobile numbers listed in the backend's <code>ADMIN_MOBILES</code> can sign in here.
        </p>
      </form>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: { width: 380, textAlign: 'center' },
  logo: { width: 64, height: 64, borderRadius: 14, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 800, margin: '0 0 4px' },
  subtitle: { fontSize: 13.5, color: 'var(--slate)', margin: '0 0 4px', textAlign: 'center' },
  devHint: { fontSize: 12, color: 'var(--gold-dark)', fontWeight: 600, marginTop: 8 },
  note: { fontSize: 11.5, color: 'var(--slate)', marginTop: 18, lineHeight: 1.5 },
};
