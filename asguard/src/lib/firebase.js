import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "your_api_key" &&
  firebaseConfig.apiKey.trim() !== "" &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== "your_project_id" &&
  firebaseConfig.projectId.trim() !== ""
);

if (!isFirebaseConfigured) {
  console.error(
    "Firebase is not configured. Please verify NEXT_PUBLIC_FIREBASE_* environment variables in .env.local"
  );
}

const app = isFirebaseConfigured
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : undefined;

const auth = app ? getAuth(app) : undefined;
const db = app ? getFirestore(app) : undefined;

export { app, auth, db, isFirebaseConfigured };
export default firebaseConfig;
