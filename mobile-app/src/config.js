// API base URL, read from an EXPO_PUBLIC_ env var (inlined by Expo's Metro
// config automatically — no extra package needed). Set it in mobile-app/.env:
//   EXPO_PUBLIC_API_URL=https://your-backend.onrender.com
// Falls back to the Android emulator's loopback to localhost for local dev.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000';
