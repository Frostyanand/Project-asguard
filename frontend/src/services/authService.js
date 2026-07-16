import { auth, db, isFirebaseConfigured } from "../firebase/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const googleProvider = new GoogleAuthProvider();

/**
 * Maps Firebase Auth and Firestore error codes to user-friendly messages.
 */
export const getFriendlyErrorMessage = (error) => {
  if (!error) return "An unknown error occurred.";
  
  const code = error.code || "";
  const message = error.message || "";

  if (code === "auth/popup-closed-by-user") {
    return "Sign-in popup was closed before completing. Please try signing in again.";
  }
  if (code === "auth/network-request-failed") {
    return "A network error occurred. Please check your internet connection and try again.";
  }
  if (code === "auth/unauthorized-domain") {
    return "This domain is not authorized for Firebase Auth. Please add localhost to your Firebase Console → Authentication → Settings → Authorized domains.";
  }
  if (code === "auth/popup-blocked") {
    return "The sign-in popup was blocked by your browser. Please allow popups for this site.";
  }
  if (code === "auth/configuration-not-found") {
    return "Google Sign-In is not configured. Please go to Firebase Console → Authentication → Sign-in method → enable Google provider.";
  }
  if (code === "auth/internal-error") {
    return "Firebase authentication encountered an internal error. Please verify your Firebase project configuration.";
  }
  if (message.includes("permission-denied")) {
    return "Database permission denied. Please verify your Firestore security rules allow read/write access.";
  }
  
  return error.message || "Authentication failed. Please try again.";
};

/**
 * Sign in with Google Popup
 */
export const signInWithGoogle = async () => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured. Please add your Firebase credentials to the .env file.");
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
 * Sign out current user
 */
export const signOutUser = async () => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured. Please add your Firebase credentials to the .env file.");
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
 * Fetch user profile from Firestore
 */
export const getUserProfile = async (uid) => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured. Please add your Firebase credentials to the .env file.");
  }

  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    const friendlyMessage = getFriendlyErrorMessage(error);
    throw new Error(friendlyMessage);
  }
};

/**
 * Checks and creates a profile document on first-time login
 */
export const createUserProfile = async (user) => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured. Please add your Firebase credentials to the .env file.");
  }

  const { uid, displayName, email, photoURL } = user;

  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      const newProfile = {
        uid,
        name: displayName || "SmartThings User",
        email: email,
        photoURL: photoURL || "",
        houseName: "My Smart Home",
        houseLocation: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(docRef, newProfile);
      return newProfile;
    }
    
    return docSnap.data();
  } catch (error) {
    const friendlyMessage = getFriendlyErrorMessage(error);
    throw new Error(friendlyMessage);
  }
};

/**
 * Update houseName/houseLocation profile in Firestore
 */
export const updateUserProfile = async (uid, data) => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured. Please add your Firebase credentials to the .env file.");
  }

  try {
    const docRef = doc(db, "users", uid);
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(docRef, updateData);
    
    // Fetch updated data to return latest state
    const docSnap = await getDoc(docRef);
    return docSnap.data();
  } catch (error) {
    const friendlyMessage = getFriendlyErrorMessage(error);
    throw new Error(friendlyMessage);
  }
};
