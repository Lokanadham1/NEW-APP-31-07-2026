import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext(null);

// No websocket infra in this app, so polling is the pragmatic stand-in for
// "the header badge updates when a new notification arrives".
const POLL_INTERVAL_MS = 30000;

// Powers the unread badge on the header's Alerts bell (both customer and
// admin — /notifications is already scoped by role on the backend). The
// Alerts screens themselves call refresh() after marking things read so the
// badge doesn't wait for the next poll tick.
export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const rows = await api.get('/notifications');
      setUnreadCount(rows.filter((n) => !n.read).length);
    } catch {
      // best-effort — a stale badge is harmless
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    refresh();
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isAuthenticated, refresh]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsBadge() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotificationsBadge must be used within a NotificationsProvider');
  return ctx;
}
