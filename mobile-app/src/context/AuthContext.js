import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import auth from '@react-native-firebase/auth';
import { api, setAuthToken } from '../api/client';
import { registerPushToken, unregisterPushToken } from '../push/notifications';

const TOKEN_KEY = 'roti_auth_token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null); // { id, mobile, customerId, role, name, cateringName, address, profileDone }
  const [bootstrapping, setBootstrapping] = useState(true);
  // Holds the Firebase confirmation object between requestOtp() and verifyOtp()
  // — Firebase's SDK returns this from signInWithPhoneNumber() and you call
  // .confirm(code) on it later, instead of us managing the code ourselves.
  const confirmationRef = useRef(null);

  // On app start, restore a saved token and re-fetch the user so an edited
  // profile / role change on the server is always reflected.
  useEffect(() => {
    (async () => {
      let saved = null;
      try {
        saved = await SecureStore.getItemAsync(TOKEN_KEY);
      } catch {
        // The stored value can't be decrypted (e.g. Android invalidated the
        // keystore key after a reinstall) — treat it like no saved session
        // instead of leaving the app stuck on the loading screen forever.
        try { await SecureStore.deleteItemAsync(TOKEN_KEY); } catch { /* best-effort */ }
      }
      if (saved) {
        setAuthToken(saved);
        try {
          const me = await api.get('/me');
          setToken(saved);
          setUser(me);
          registerPushToken(); // fire-and-forget, never blocks app start
        } catch {
          // token expired/invalid — clear it silently
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          setAuthToken(null);
        }
      }
      setBootstrapping(false);
    })();
  }, []);

  // Sends the SMS via Firebase directly from the device — no backend call.
  // `mobile` is a bare 10-digit Indian number; Firebase needs E.164 (+91...).
  const requestOtp = useCallback(async (mobile) => {
    const confirmation = await auth().signInWithPhoneNumber('+91' + mobile);
    confirmationRef.current = confirmation;
    return { sent: true };
  }, []);

  // Confirms the code with Firebase (client-side), then exchanges the
  // resulting Firebase ID token with our backend for our own app JWT.
  const verifyOtp = useCallback(async (mobile, code) => {
    if (!confirmationRef.current) {
      throw new Error('Please request a new code.');
    }
    let idToken;
    try {
      const userCredential = await confirmationRef.current.confirm(code);
      idToken = await userCredential.user.getIdToken();
    } catch (e) {
      // Firebase throws its own error codes (e.g. auth/invalid-verification-code)
      throw new Error(e.code === 'auth/invalid-verification-code' ? 'Incorrect code.' : (e.message || 'Verification failed.'));
    }
    const res = await api.post('/auth/firebase', { idToken }, { auth: false });
    await SecureStore.setItemAsync(TOKEN_KEY, res.token);
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
    confirmationRef.current = null;
    registerPushToken(); // fire-and-forget, never blocks the login flow
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
    await unregisterPushToken();
    try { await auth().signOut(); } catch { /* best-effort */ }
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