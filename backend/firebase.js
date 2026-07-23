// backend/firebase.js — Firebase Admin SDK: verify Phone Auth ID tokens and
// send push notifications (FCM). Lazy-loaded so the app runs without
// firebase-admin configured (dev mode / no push yet).
let admin = null;

function init() {
  if (admin) return admin;
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return null;
  admin = require("firebase-admin");
  // FIREBASE_SERVICE_ACCOUNT = absolute path to the service-account JSON you
  // download from Firebase console → Project settings → Service accounts.
  const svc = require(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(svc) });
  return admin;
}

// Returns the E.164 phone number (e.g. "+919876543210") from a verified token.
async function verifyFirebaseToken(idToken) {
  const a = init();
  if (!a) throw new Error("Firebase is not configured on this server.");
  const decoded = await a.auth().verifyIdToken(idToken);
  if (!decoded.phone_number) throw new Error("Token has no phone number.");
  return decoded.phone_number;
}

// Sends the same notification to a batch of FCM device tokens. Best-effort:
// never throws (a push failure should never break the API request that
// triggered it) and returns the subset of tokens FCM reports as dead
// (uninstalled app / stale token) so the caller can prune them.
async function sendPush(tokens, { title, body, data = {} }) {
  if (!tokens.length) return { deadTokens: [] };
  const a = init();
  if (!a) return { deadTokens: [] }; // Firebase not configured — no-op

  try {
    const res = await a.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: { priority: "high" },
    });
    const deadTokens = [];
    res.responses.forEach((r, i) => {
      const code = r.error?.code;
      if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
        deadTokens.push(tokens[i]);
      }
    });
    return { deadTokens };
  } catch (e) {
    console.error("Push send failed:", e.message);
    return { deadTokens: [] };
  }
}

module.exports = { verifyFirebaseToken, sendPush };
