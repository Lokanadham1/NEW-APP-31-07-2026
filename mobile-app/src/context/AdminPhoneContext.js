import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Linking, Alert } from 'react-native';
import { api } from '../api/client';

const AdminPhoneContext = createContext(null);

// Fetched once at app root (public, unauthenticated /config) instead of
// every screen fetching it separately — the Call button now shows up on
// every customer screen via the shared Header, not just Home.
export function AdminPhoneProvider({ children }) {
  const [adminPhone, setAdminPhone] = useState(null);

  useEffect(() => {
    api.get('/config', { auth: false }).then((c) => setAdminPhone(c.adminPhone)).catch(() => {});
  }, []);

  const callAdmin = useCallback(() => {
    if (!adminPhone) {
      Alert.alert('Not available', "The admin's contact number isn't configured yet.");
      return;
    }
    Linking.openURL(`tel:${adminPhone}`).catch(() =>
      Alert.alert('Could not open dialer', adminPhone)
    );
  }, [adminPhone]);

  return (
    <AdminPhoneContext.Provider value={{ adminPhone, callAdmin }}>
      {children}
    </AdminPhoneContext.Provider>
  );
}

export function useAdminPhone() {
  const ctx = useContext(AdminPhoneContext);
  if (!ctx) throw new Error('useAdminPhone must be used within an AdminPhoneProvider');
  return ctx;
}
