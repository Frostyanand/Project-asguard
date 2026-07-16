import { NextResponse } from "next/server";
import { adminApp, adminAuth, adminFirestore } from "@/firebase/admin";

export async function GET() {
  try {
    // 1. Verify Exports & Initialization
    if (!adminApp) {
      throw new Error("Firebase Admin App (adminApp) failed to initialize or is undefined.");
    }
    if (!adminAuth) {
      throw new Error("Firebase Admin Auth (adminAuth) failed to initialize or is undefined.");
    }
    if (!adminFirestore) {
      throw new Error("Firebase Admin Firestore (adminFirestore) failed to initialize or is undefined.");
    }

    // 2. Verify Firebase Authentication Accessibility
    try {
      await adminAuth.listUsers(1);
    } catch (authErr) {
      throw new Error(`Firebase Admin Auth listUsers verification failed: ${authErr.message}`);
    }

    // 3. Verify Firestore Connection & List Top-Level Collections
    let collections = [];
    try {
      const collectionsSnap = await adminFirestore.listCollections();
      collections = collectionsSnap.map((col) => col.id);
    } catch (dbErr) {
      throw new Error(`Cloud Firestore listCollections verification failed: ${dbErr.message}`);
    }

    // 4. Verify Firestore Read Access for Core Collections
    const targetCollections = ["users", "houses", "energy_logs"];
    const collectionStatus = {};

    for (const colId of targetCollections) {
      if (collections.includes(colId)) {
        try {
          const snap = await adminFirestore.collection(colId).limit(1).get();
          collectionStatus[colId] = !snap.empty || snap.docs.length >= 0;
        } catch (readErr) {
          console.warn(`[Admin Route Audit Warning] Read failed for ${colId}:`, readErr.message);
          collectionStatus[colId] = false;
        }
      } else {
        collectionStatus[colId] = false;
      }
    }

    // 5. Check Optional Storage Instance
    let storageConnected = false;
    try {
      if (typeof adminApp.storage === "function") {
        const bucket = adminApp.storage().bucket();
        storageConnected = Boolean(bucket);
      }
    } catch (storageErr) {
      console.warn("[Admin Route Audit Warning] Storage initialization check warning:", storageErr.message);
      storageConnected = false;
    }

    return NextResponse.json(
      {
        success: true,
        firebaseAdmin: true,
        firebaseAuth: true,
        firestoreConnected: true,
        storageConnected,
        collections,
        collectionStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Admin API Test Failure] Exception:", error);
    return NextResponse.json(
      {
        success: false,
        firebaseAdmin: false,
        error: error.message || "An unexpected error occurred during Admin SDK verification.",
        stack: error.stack || null,
      },
      { status: 500 }
    );
  }
}
