// src/lib/firebase.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function normalizePrivateKey(key?: string): string {
  if (!key) throw new Error("FIREBASE_PRIVATE_KEY is not set");

  let normalized = key;

  // 1. 前後の " を除去
  if (normalized.startsWith('"') && normalized.endsWith('"')) {
    normalized = normalized.slice(1, -1);
  }

  // 2. \n を改行に変換
  normalized = normalized.replace(/\\n/g, "\n").trim();

  return normalized;
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

export const db = getFirestore(firebaseApp);
