import { auth, db, isFirebaseConfigured } from "./client";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

const googleProvider = new GoogleAuthProvider();

export const getFriendlyErrorMessage = (error) => {
  if (!error) return "An unknown error occurred.";
  
  const code = error.code || "";
  const message = error.message || "";

  if (code === "auth/popup-closed-by-user") {
    return "Sign-in popup was closed before completing. Please try signing in again.";
  }
  if (code === "auth/network-request-failed") {
    return "A network connection error occurred with Firebase Auth. Please verify your internet connection and retry.";
  }
  if (code === "auth/internal-error") {
    return "Firebase Auth internal error. Retrying request...";
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
  
  return error.message || "Authentication failed. Please try again.";
};

export const signInWithGoogle = async () => {
  console.log("[Auth Audit] Calling signInWithPopup for Google Auth...");
  if (!isFirebaseConfigured || !auth) {
    const err = new Error("Firebase is not configured. Please check your .env.local file.");
    err.code = "auth/not-configured";
    throw err;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("[Auth Audit] Firebase Response Received for Google Auth. User UID:", result.user.uid);
    return result.user;
  } catch (error) {
    console.error("[Auth Audit Failure] signInWithPopup Exception - Code:", error?.code, "Message:", error?.message, "Stack:", error?.stack);
    throw error;
  }
};

export const signInWithEmail = async (email, password) => {
  console.log("[Auth Audit] Calling signInWithEmailAndPassword for:", email);
  if (!isFirebaseConfigured || !auth) {
    const err = new Error("Firebase is not configured. Please check your .env.local file.");
    err.code = "auth/not-configured";
    throw err;
  }

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log("[Auth Audit] Firebase Response Received for Email Login. User UID:", result.user.uid);
    return result.user;
  } catch (error) {
    console.error("[Auth Audit Failure] signInWithEmailAndPassword Exception - Code:", error?.code, "Message:", error?.message, "Stack:", error?.stack);
    throw error;
  }
};

export const signUpWithEmail = async (email, password, displayName = "") => {
  console.log("[Auth Audit] Registration Started - Calling createUserWithEmailAndPassword for:", email);
  if (!isFirebaseConfigured || !auth) {
    const err = new Error("Firebase is not configured. Please check your .env.local file.");
    err.code = "auth/not-configured";
    throw err;
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const createdUser = result.user;
    console.log("[Auth Audit] Firebase Authentication User Created. User UID:", createdUser.uid);

    if (displayName && displayName.trim() !== "") {
      try {
        await updateProfile(createdUser, {
          displayName: displayName.trim(),
        });
        console.log("[Auth Audit] Firebase User displayName updated successfully via updateProfile SDK.");
      } catch (updateErr) {
        console.warn("[Auth Audit Warning] updateProfile failed non-critically - Code:", updateErr?.code, "Message:", updateErr?.message);
      }
    }
    return createdUser;
  } catch (error) {
    console.error("[Auth Audit Failure] createUserWithEmailAndPassword Exception - Code:", error?.code, "Message:", error?.message, "Stack:", error?.stack);
    throw error;
  }
};

export const signOutUser = async () => {
  console.log("[Auth Audit] Calling signOut...");
  if (!isFirebaseConfigured || !auth) {
    const err = new Error("Firebase is not configured.");
    err.code = "auth/not-configured";
    throw err;
  }

  try {
    await signOut(auth);
    console.log("[Auth Audit] SignOut completed successfully.");
    return true;
  } catch (error) {
    console.error("[Auth Audit Failure] signOut Exception - Code:", error?.code, "Message:", error?.message, "Stack:", error?.stack);
    throw error;
  }
};

export const createUserProfile = async (user, displayNameOverride = "") => {
  if (!user || !user.uid) {
    console.warn("[Auth Audit] Invalid user object passed to createUserProfile.");
    return null;
  }

  const targetUid = user.uid;
  const email = user.email || "";
  const name = displayNameOverride || user.displayName || (email ? email.split("@")[0] : "SmartThings User");
  const photoURL = user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200";

  console.log("[Auth Audit] Creating Firestore Profile for UID:", targetUid);

  const newProfile = {
    uid: targetUid,
    name,
    email,
    photoURL,
    houseName: "Smart Villa Chennai",
    houseLocation: "Chennai, Tamil Nadu, India",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!isFirebaseConfigured || !db) {
    return newProfile;
  }

  // Non-blocking background sync
  (async () => {
    try {
      const userDocRef = doc(db, "users", targetUid);
      await setDoc(userDocRef, newProfile, { merge: true });
      console.log("[Auth Audit] Firestore Profile Created successfully for UID:", targetUid);
    } catch (dbErr) {
      console.warn("[Auth Audit Firestore Sync Warning] Code:", dbErr?.code, "Message:", dbErr?.message);
    }
  })();

  return newProfile;
};

export const updateUserProfile = async (uid, data) => {
  console.log("[Auth Audit] Updating profile for UID:", uid);
  if (!isFirebaseConfigured || !db) return data;

  try {
    const docRef = doc(db, "users", uid);
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(docRef, updateData);
    console.log("[Auth Audit] Profile updated successfully for UID:", uid);
    return updateData;
  } catch (error) {
    console.error("[Auth Audit Exception] updateUserProfile - Code:", error?.code, "Message:", error?.message, "Stack:", error?.stack);
    throw error;
  }
};
