import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, setAuthToken } from '../api/client';

const TOKEN_KEY = 'roti_auth_token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null); // { id, mobile, customerId, role, name, cateringName, address, profileDone }
  const [bootstrapping, setBootstrapping] = useState(true);

  // On app start, restore a saved token and re-fetch the user so an edited
  // profile / role change on the server is always reflected.
  useEffect(() => {
    (async () => {
      const saved = await SecureStore.getItemAsync(TOKEN_KEY);
      if (saved) {
        setAuthToken(saved);
        try {
          const me = await api.get('/me');
          setToken(saved);
          setUser(me);
        } catch {
          // token expired/invalid — clear it silently
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          setAuthToken(null);
        }
      }
      setBootstrapping(false);
    })();
  }, []);

  const requestOtp = useCallback(async (mobile) => api.post('/auth/request-otp', { mobile }, { auth: false }), []);

  const verifyOtp = useCallback(async (mobile, code) => {
    const res = await api.post('/auth/verify-otp', { mobile, code }, { auth: false });
    await SecureStore.setItemAsync(TOKEN_KEY, res.token);
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const completeProfile = useCallback(async ({ name, cateringName, address }) => {
    const updated = await api.put('/me/profile', { name, cateringName, address });
    setUser(updated);
    return updated;
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await api.get('/me');
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    token, user, bootstrapping,
    isAuthenticated: !!token,
    requestOtp, verifyOtp, completeProfile, refreshUser, logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
