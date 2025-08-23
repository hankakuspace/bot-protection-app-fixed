// src/lib/firebase.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const rawKey = process.env.FIREBASE_PRIVATE_KEY || "";

// 🔥 デバッグ: デプロイ時に値を確認する
console.log("🔥 FIREBASE_PRIVATE_KEY (raw head):", rawKey.slice(0, 100));
console.log("🔥 FIREBASE_PRIVATE_KEY (raw tail):", rawKey.slice(-50));

const firebaseApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: rawKey
            .replace(/^"|"$/g, "") // 前後の " を削除
            .replace(/\\n/g, "\n") // \n を改行に変換
            .trim(),
        }),
      })
    : getApps()[0];

export const db = getFirestore(firebaseApp);
