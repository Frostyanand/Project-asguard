'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { auth, isFirebaseConfigured } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  createUserProfile,
  updateUserProfile,
} from "../lib/authService";

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
          console.warn("Background Firestore profile load warning:", err.message);
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

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
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
      setLoading(false);

      try {
        const profile = await createUserProfile(user);
        if (profile) setCurrentUser(profile);
        return profile || basicProfile;
      } catch (err) {
        return basicProfile;
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const loginWithEmailPassword = async (email, password) => {
    setLoading(true);
    try {
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
      setLoading(false);
      return basicProfile;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const registerWithEmailPassword = async (email, password, displayName) => {
    setLoading(true);
    try {
      const user = await signUpWithEmail(email, password, displayName);
      const profile = await createUserProfile(user);
      setCurrentUser(profile);
      setLoading(false);
      return profile;
    } catch (error) {
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
