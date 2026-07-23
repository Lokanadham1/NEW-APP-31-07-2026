// Push notifications (FCM via expo-notifications). Getting a *real*, usable
// device token requires the app to be built with your own Firebase Android
// app registered (google-services.json) — same prerequisite as Firebase
// Phone Auth, see mobile-app/README.md. In Expo Go, or before that's set up,
// every function here fails safely and silently: push is a nice-to-have and
// must never break login, logout, or crash the app.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let currentToken = null;

// Requests permission (if needed) and registers this device's token with the
// backend. Call after login and on app start when a session is restored.
export async function registerPushToken() {
  try {
    if (Platform.OS !== 'android') return; // this app targets Android; iOS would need APNs setup too

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;

    const { data: token } = await Notifications.getDevicePushTokenAsync();
    currentToken = token;
    await api.post('/me/push-token', { token, platform: 'android' });
  } catch (e) {
    console.log('Push registration skipped:', e.message);
  }
}

// Unregisters the current device token. Call before clearing the session on
// logout so the backend stops sending this device notifications for an
// account that's no longer signed in on it.
export async function unregisterPushToken() {
  if (!currentToken) return;
  const token = currentToken;
  currentToken = null;
  try {
    await api.del('/me/push-token', { body: { token } });
  } catch {
    // best-effort — the token will naturally get pruned server-side the
    // next time a push to it fails anyway.
  }
}
