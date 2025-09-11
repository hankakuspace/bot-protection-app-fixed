// src/lib/firebase.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// 🔥 デバッグ用ログ
console.log("🔥 Firebase env check", {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
  privateKeyHead: process.env.FIREBASE_PRIVATE_KEY?.slice(0, 30),
});

const firebaseApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID || "bot-protection-6218f",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY
            ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n").replace(/"/g, "")
            : undefined,
        }),
      })
    : getApps()[0];

export const db = getFirestore(firebaseApp);
