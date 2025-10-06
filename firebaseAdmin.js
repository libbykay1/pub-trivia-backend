// backend/firebaseAdmin.js
import admin from "firebase-admin";

function getCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    const json = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, "base64").toString("utf8")
    );
    return admin.credential.cert(json);
  }
  return admin.credential.applicationDefault();
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: getCredential() });
}

export const adminAuth = admin.auth();

