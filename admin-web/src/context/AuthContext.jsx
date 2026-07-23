import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, setAuthToken } from '../api/client';

const TOKEN_KEY = 'roti_admin_token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = localStorage.getItem(TOKEN_KEY);
      if (saved) {
        setAuthToken(saved);
        try {
          const me = await api.get('/me');
          if (me.role !== 'admin') throw new Error('Not an admin account.');
          setToken(saved);
          setUser(me);
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          setAuthToken(null);
        }
      }
      setBootstrapping(false);
    })();
  }, []);

  const requestOtp = useCallback(async (mobile) => api.post('/auth/request-otp', { mobile }, { auth: false }), []);

  const verifyOtp = useCallback(async (mobile, code) => {
    const res = await api.post('/auth/verify-otp', { mobile, code }, { auth: false });
    if (res.role !== 'admin') {
      throw new Error('This number is not registered as an admin. Ask the owner to add it to ADMIN_MOBILES.');
    }
    localStorage.setItem(TOKEN_KEY, res.token);
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    token, user, bootstrapping,
    isAuthenticated: !!token,
    requestOtp, verifyOtp, logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
