import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const envKeys = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const missingKeys = Object.entries(envKeys)
  .filter(([_, val]) => !val || val.trim() === "" || val.includes("your_"))
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.error(
    `[Firebase Client Runtime Check] ⚠️ MISSING ENV KEYS (${missingKeys.length}):`,
    missingKeys.join(", ")
  );
}

const firebaseConfig = {
  apiKey: envKeys.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envKeys.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envKeys.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envKeys.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envKeys.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envKeys.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: envKeys.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const isFirebaseConfigured = missingKeys.length === 0;

let app;
let auth;
let db;
let storage;

try {
  if (isFirebaseConfigured) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
} catch (initErr) {
  console.error("[Firebase Client] Initialization Exception - Code:", initErr.code, "Message:", initErr.message);
}

export { app, auth, db, storage, isFirebaseConfigured };
