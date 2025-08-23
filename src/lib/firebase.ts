// src/lib/firebase.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const firebaseApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // 環境変数の前後の " を削除し、\n を改行に戻し、余計な空白を除去
          privateKey: process.env.FIREBASE_PRIVATE_KEY
            ?.replace(/^"|"$/g, "")
            .replace(/\\n/g, "\n")
            .trim(),
        }),
      })
    : getApps()[0];

export const db = getFirestore(firebaseApp);
