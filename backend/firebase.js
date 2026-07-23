// backend/firebase.js — verify Firebase ID tokens (lazy-loaded so the app runs
// without firebase-admin when OTP_PROVIDER isn't "firebase").
let admin = null;

function init() {
  if (admin) return admin;
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
  const decoded = await a.auth().verifyIdToken(idToken);
  if (!decoded.phone_number) throw new Error("Token has no phone number.");
  return decoded.phone_number;
}

module.exports = { verifyFirebaseToken };
