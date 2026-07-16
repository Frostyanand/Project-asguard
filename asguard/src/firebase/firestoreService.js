import { db, isFirebaseConfigured } from "./client";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  limit,
  orderBy,
  where,
} from "firebase/firestore";

/**
 * Fetch recent telemetry records from the energy_logs collection
 */
export const fetchEnergyLogs = async (limitCount = 20) => {
  if (!isFirebaseConfigured || !db) {
    return [];
  }

  try {
    const logsRef = collection(db, "energy_logs");
    const q = query(logsRef, limit(limitCount));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return [];
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn("fetchEnergyLogs error:", error.message);
    return [];
  }
};

/**
 * Fetch AI Recommendations from houses/HOUSE001/ai_recommendations
 */
export const fetchAiRecommendations = async () => {
  if (!isFirebaseConfigured || !db) {
    return [];
  }

  try {
    const recsRef = collection(db, "houses", "HOUSE001", "ai_recommendations");
    const snapshot = await getDocs(recsRef);
    if (snapshot.empty) return [];
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn("fetchAiRecommendations error:", error.message);
    return [];
  }
};

/**
 * Fetch User Profile Document by UID
 */
export const getUserProfileDocument = async (uid) => {
  if (!isFirebaseConfigured || !db || !uid) return null;

  try {
    const userDocRef = doc(db, "users", uid);
    const docSnap = await getDoc(userDocRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.warn("getUserProfileDocument error:", error.message);
    return null;
  }
};

/**
 * Save / Update User Profile Document
 */
export const saveUserProfileDocument = async (uid, profileData) => {
  if (!isFirebaseConfigured || !db || !uid) return profileData;

  try {
    const userDocRef = doc(db, "users", uid);
    const payload = {
      ...profileData,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userDocRef, payload, { merge: true });
    return payload;
  } catch (error) {
    console.error("saveUserProfileDocument error:", error.message);
    throw error;
  }
};
