'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { auth, isFirebaseConfigured } from "../firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  createUserProfile,
  updateUserProfile,
} from "../firebase/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(null);
  const authResolved = useRef(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setFirebaseError(
        "Firebase credentials are not configured in NEXT_PUBLIC_FIREBASE_* variables."
      );
      setLoading(false);
      return;
    }

    const timeout = setTimeout(() => {
      if (!authResolved.current) {
        authResolved.current = true;
        setLoading(false);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      authResolved.current = true;
      clearTimeout(timeout);

      if (firebaseUser) {
        console.log("[Registration Audit Context] onAuthStateChanged active user detected UID:", firebaseUser.uid);
        const basicProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "SmartThings User",
          email: firebaseUser.email || "",
          photoURL: firebaseUser.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
          houseName: "Smart Villa Chennai",
          houseLocation: "Chennai, Tamil Nadu, India",
        };
        setCurrentUser(basicProfile);
        setLoading(false);

        try {
          const profile = await createUserProfile(firebaseUser);
          if (profile) {
            setCurrentUser(profile);
          }
        } catch (err) {
          console.warn("[Registration Audit Context] Background profile load warning:", err.message);
        }
      } else {
        console.log("[Registration Audit Context] onAuthStateChanged: No active user session.");
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      console.log("[Registration Audit Context] Initiating Google login...");
      const user = await signInWithGoogle();
      const basicProfile = {
        uid: user.uid,
        name: user.displayName || user.email?.split("@")[0] || "SmartThings User",
        email: user.email || "",
        photoURL: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
        houseName: "Smart Villa Chennai",
        houseLocation: "Chennai, Tamil Nadu, India",
      };
      setCurrentUser(basicProfile);

      try {
        const profile = await createUserProfile(user);
        if (profile) setCurrentUser(profile);
        return profile || basicProfile;
      } catch (err) {
        return basicProfile;
      }
    } catch (error) {
      console.error("[Registration Audit Context] Google Login Exception Code:", error.code, "Message:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmailPassword = async (email, password) => {
    setLoading(true);
    try {
      console.log("[Registration Audit Context] Initiating Email/Password login...");
      const user = await signInWithEmail(email, password);
      const basicProfile = {
        uid: user.uid,
        name: user.displayName || email.split("@")[0] || "SmartThings User",
        email: user.email || email,
        photoURL: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
        houseName: "Smart Villa Chennai",
        houseLocation: "Chennai, Tamil Nadu, India",
      };
      setCurrentUser(basicProfile);
      return basicProfile;
    } catch (error) {
      console.error("[Registration Audit Context] Email Login Exception Code:", error.code, "Message:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmailPassword = async (email, password, displayName) => {
    setLoading(true);
    try {
      console.log("[Registration Audit Context] Starting registerWithEmailPassword for:", email);
      const user = await signUpWithEmail(email, password, displayName);
      console.log("[Registration Audit Context] User created in Auth. Returned UID:", user.uid);
      
      const profile = await createUserProfile(user, displayName);
      console.log("[Registration Audit Context] User Profile created for UID:", user.uid);
      setCurrentUser(profile);
      return profile;
    } catch (error) {
      console.error("[Registration Audit Context] Exception in registerWithEmailPassword - Code:", error.code, "Message:", error.message);
      throw error;
    } finally {
      console.log("[Registration Audit Context] Clearing AuthContext loading state in finally block.");
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOutUser();
      setCurrentUser(null);
    } catch (error) {
      console.error("[Registration Audit Context] Logout Exception Code:", error.code, "Message:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    if (!currentUser) throw new Error("No active user session found");
    try {
      const updated = await updateUserProfile(currentUser.uid, profileData);
      setCurrentUser((prev) => ({ ...prev, ...updated }));
      return updated;
    } catch (error) {
      console.error("[Registration Audit Context] Update Profile Exception Code:", error.code, "Message:", error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        firebaseError,
        loginWithGoogle,
        loginWithEmailPassword,
        registerWithEmailPassword,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
