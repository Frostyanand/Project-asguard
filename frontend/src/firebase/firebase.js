import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration sourced from environment variables.
// Create a .env file in the project root. Refer to .env.example for required keys.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate that the minimum required credentials are present
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
    "Firebase is not configured. " +
    "Please create a .env file in the project root with valid Firebase credentials. " +
    "Refer to .env.example for the required variables."
  );
}

// Initialize Firebase services
const app = isFirebaseConfigured
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : undefined;

const auth = app ? getAuth(app) : undefined;
const db = app ? getFirestore(app) : undefined;

if (isFirebaseConfigured) {
  console.log(
    `[SmartThings Firebase] Initialized successfully. Project: ${firebaseConfig.projectId}`
  );
}

export { app, auth, db, isFirebaseConfigured };
