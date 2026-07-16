import { storage, isFirebaseConfigured } from "./client";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";

/**
 * Upload a file blob to Cloud Storage path
 */
export const uploadFile = async (path, fileBlob) => {
  if (!isFirebaseConfigured || !storage) {
    console.warn("Storage is not configured.");
    return null;
  }

  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, fileBlob);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error("[Storage Service Error] uploadFile Code:", error.code, "Message:", error.message);
    throw error;
  }
};

/**
 * Get public download URL for a file path
 */
export const getFileDownloadUrl = async (path) => {
  if (!isFirebaseConfigured || !storage) return null;

  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.warn("[Storage Service Warning] getFileDownloadUrl Code:", error.code, "Message:", error.message);
    return null;
  }
};

/**
 * Delete a file from Cloud Storage
 */
export const deleteFile = async (path) => {
  if (!isFirebaseConfigured || !storage) return false;

  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error("[Storage Service Error] deleteFile Code:", error.code, "Message:", error.message);
    return false;
  }
};

/**
 * Upload user profile avatar image
 */
export const uploadAvatarImage = async (uid, fileBlob) => {
  const filePath = `avatars/${uid}_${Date.now()}.png`;
  return await uploadFile(filePath, fileBlob);
};
