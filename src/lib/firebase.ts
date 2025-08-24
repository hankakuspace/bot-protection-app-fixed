// src/lib/firebase.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";

// 前後のダブルクォートを削除
privateKey = privateKey.replace(/^"|"$/g, "");

// \n文字列 → 実際の改行に変換
if (privateKey.includes("\\n")) {
  privateKey = privateKey.replace(/\\n/g, "\n");
}

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
