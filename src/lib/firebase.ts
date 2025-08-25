// src/lib/firebase.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function normalizePrivateKey(key?: string): string {
  if (!key) throw new Error("FIREBASE_PRIVATE_KEY is not set");

  return key
    .trim()
    .replace(/^"+|"+$/g, "")  // 前後のダブルクォートを削除
    .replace(/\\n/g, "\n");   // \n を改行に変換
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
