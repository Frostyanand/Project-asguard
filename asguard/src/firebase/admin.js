import * as admin from "firebase-admin";

function initializeAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && rawPrivateKey) {
    const privateKey = rawPrivateKey.replace(/\\n/g, "\n");
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  }

  return null;
}

const adminApp = initializeAdmin();
const adminAuth = adminApp ? admin.auth() : null;
const adminFirestore = adminApp ? admin.firestore() : null;
const adminDb = adminFirestore;
const adminStorage = adminApp ? admin.storage() : null;

export { adminApp, adminAuth, adminFirestore, adminDb, adminStorage };
