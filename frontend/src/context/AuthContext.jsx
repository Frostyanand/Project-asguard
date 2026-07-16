import React, { createContext, useState, useEffect, useRef } from "react";
import { auth, isFirebaseConfigured } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  signInWithGoogle,
  signOutUser,
  createUserProfile,
  updateUserProfile,
} from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(null);
  const authResolved = useRef(false);

  useEffect(() => {
    console.log("[SmartThings Auth] Initializing auth listener...");
    console.log("[SmartThings Auth] isFirebaseConfigured:", isFirebaseConfigured);
    console.log("[SmartThings Auth] auth object:", auth ? "present" : "undefined");

    if (!isFirebaseConfigured || !auth) {
      console.error("[SmartThings Auth] Firebase not configured — skipping auth listener.");
      setFirebaseError(
        "Firebase is not configured. Please create a .env file with valid Firebase credentials. Refer to .env.example for the required variables."
      );
      setLoading(false);
      return;
    }

    // Safety timeout: if onAuthStateChanged never fires within 5 seconds,
    // release the loading state so the user isn't stuck on the spinner.
    const timeout = setTimeout(() => {
      if (!authResolved.current) {
        console.warn("[SmartThings Auth] Auth listener timed out after 5s. Releasing loading state.");
        authResolved.current = true;
        setLoading(false);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[SmartThings Auth] onAuthStateChanged fired. User:", firebaseUser ? firebaseUser.email : "null (not logged in)");
      authResolved.current = true;
      clearTimeout(timeout);

      if (firebaseUser) {
        // Set a basic user profile from Firebase Auth immediately so the
        // app is never stuck waiting on Firestore.
        const basicProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || "SmartThings User",
          email: firebaseUser.email || "",
          photoURL: firebaseUser.photoURL || "",
          houseName: "My Smart Home",
          houseLocation: "",
        };
        setCurrentUser(basicProfile);
        setLoading(false);

        // Then try to load the full Firestore profile in the background.
        try {
          const firestoreProfile = await createUserProfile(firebaseUser);
          if (firestoreProfile) {
            console.log("[SmartThings Auth] Firestore profile loaded:", firestoreProfile.name);
            setCurrentUser(firestoreProfile);
          }
        } catch (error) {
          console.warn("[SmartThings Auth] Firestore profile fetch failed (using Auth data instead):", error.message);
          // Keep using the basic profile from Firebase Auth — don't break the flow.
        }
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const login = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      console.log("[SmartThings Auth] Google Sign-In succeeded:", user.email);

      // Set basic profile from Auth immediately
      const basicProfile = {
        uid: user.uid,
        name: user.displayName || "SmartThings User",
        email: user.email || "",
        photoURL: user.photoURL || "",
        houseName: "My Smart Home",
        houseLocation: "",
      };
      setCurrentUser(basicProfile);
      setLoading(false);

      // Then try Firestore in the background
      try {
        const profile = await createUserProfile(user);
        if (profile) {
          setCurrentUser(profile);
        }
        return profile || basicProfile;
      } catch (firestoreError) {
        console.warn("[SmartThings Auth] Firestore write failed (user is still logged in):", firestoreError.message);
        return basicProfile;
      }
    } catch (error) {
      console.error("[SmartThings Auth] Login failure:", error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOutUser();
      setCurrentUser(null);
    } catch (error) {
      console.error("[SmartThings Auth] Logout failure:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    if (!currentUser) throw new Error("No active user session found");
    try {
      const updated = await updateUserProfile(currentUser.uid, profileData);
      setCurrentUser(updated);
      return updated;
    } catch (error) {
      console.error("[SmartThings Auth] Update profile failure:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        logout,
        updateProfile,
        firebaseError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
