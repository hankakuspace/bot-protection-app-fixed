// src/lib/firebase.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const firebaseApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // 前後のダブルクォートを削除し、\n を改行に変換
          privateKey: process.env.FIREBASE_PRIVATE_KEY
            ?.replace(/^"|"$/g, "")
            .replace(/\\n/g, "\n"),
        }),
      })
    : getApps()[0];

export const db = getFirestore(firebaseApp);
