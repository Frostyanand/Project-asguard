import { auth, db, isFirebaseConfigured } from "./firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const googleProvider = new GoogleAuthProvider();

export const getFriendlyErrorMessage = (error) => {
  if (!error) return "An unknown error occurred.";
  
  const code = error.code || "";
  const message = error.message || "";

  if (code === "auth/popup-closed-by-user") {
    return "Sign-in popup was closed before completing. Please try signing in again.";
  }
  if (code === "auth/network-request-failed") {
    return "A network error occurred. Please check your internet connection.";
  }
  if (code === "auth/unauthorized-domain") {
    return "This domain is not authorized for Firebase Auth. Please add localhost to Firebase authorized domains.";
  }
  if (code === "auth/popup-blocked") {
    return "The sign-in popup was blocked by your browser. Please allow popups for this site.";
  }
  if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  if (code === "auth/email-already-in-use") {
    return "An account with this email address already exists. Please log in instead.";
  }
  if (code === "auth/weak-password") {
    return "Password should be at least 6 characters long.";
  }
  if (code === "auth/configuration-not-found") {
    return "Google Sign-In is not enabled in Firebase Console → Authentication → Sign-in method.";
  }
  if (message.includes("permission-denied")) {
    return "Database permission denied. Please check your Firestore security rules.";
  }
  
  return error.message || "Authentication failed. Please try again.";
};

/**
 * Sign in with Google Popup
 */
export const signInWithGoogle = async () => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Firebase is not configured. Please check your .env.local file.");
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    const friendlyMessage = getFriendlyErrorMessage(error);
    const newError = new Error(friendlyMessage);
    newError.code = error.code;
    throw newError;
  }
};

/**
 * Sign in with Email and Password
 */
export const signInWithEmail = async (email, password) => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Firebase is not configured. Please check your .env.local file.");
  }

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    const friendlyMessage = getFriendlyErrorMessage(error);
    const newError = new Error(friendlyMessage);
    newError.code = error.code;
    throw newError;
  }
};

/**
 * Sign up with Email and Password
 */
export const signUpWithEmail = async (email, password, displayName = "") => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Firebase is not configured. Please check your .env.local file.");
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    if (displayName) {
      user.displayName = displayName;
    }
    return user;
  } catch (error) {
    const friendlyMessage = getFriendlyErrorMessage(error);
    const newError = new Error(friendlyMessage);
    newError.code = error.code;
    throw newError;
  }
};

/**
 * Sign out current user
 */
export const signOutUser = async () => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Firebase is not configured.");
  }

  try {
    await signOut(auth);
    return true;
  } catch (error) {
    const friendlyMessage = getFriendlyErrorMessage(error);
    throw new Error(friendlyMessage);
  }
};

/**
 * Create or fetch Firestore user profile document (users/{uid})
 */
export const createUserProfile = async (user) => {
  if (!isFirebaseConfigured || !db) {
    return {
      uid: user.uid,
      name: user.displayName || user.email?.split("@")[0] || "SmartThings User",
      email: user.email || "",
      photoURL: user.photoURL || "",
      houseName: "Smart Villa Chennai",
      houseLocation: "Chennai, Tamil Nadu, India",
    };
  }

  const { uid, displayName, email, photoURL } = user;

  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      const newProfile = {
        uid,
        name: displayName || email?.split("@")[0] || "SmartThings User",
        email: email || "",
        photoURL: photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
        houseName: "Smart Villa Chennai",
        houseLocation: "Chennai, Tamil Nadu, India",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(docRef, newProfile);
      return newProfile;
    }

    return docSnap.data();
  } catch (error) {
    console.warn("Firestore profile sync warning:", error.message);
    return {
      uid,
      name: displayName || email?.split("@")[0] || "SmartThings User",
      email: email || "",
      photoURL: photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
      houseName: "Smart Villa Chennai",
      houseLocation: "Chennai, Tamil Nadu, India",
    };
  }
};

/**
 * Update house details in Firestore
 */
export const updateUserProfile = async (uid, data) => {
  if (!isFirebaseConfigured || !db) return data;

  try {
    const docRef = doc(db, "users", uid);
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(docRef, updateData);
    const docSnap = await getDoc(docRef);
    return docSnap.data();
  } catch (error) {
    const friendlyMessage = getFriendlyErrorMessage(error);
    throw new Error(friendlyMessage);
  }
};
