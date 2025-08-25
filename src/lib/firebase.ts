// src/lib/firebase.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function normalizePrivateKey(key?: string): string {
  if (!key) throw new Error("FIREBASE_PRIVATE_KEY is not set");
  return key.trim().replace(/^"+|"+$/g, "").replace(/\\n/g, "\n");
}

const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

const firebaseApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      })
    : getApps()[0];

// ✅ export を明示
export const db = getFirestore(firebaseApp);
