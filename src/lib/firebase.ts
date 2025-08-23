// src/lib/firebase.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const rawKey = process.env.FIREBASE_PRIVATE_KEY || "";

// 🔥 デバッグ出力（本番ログで確認する）
console.log("🔥 FIREBASE_PRIVATE_KEY head:", rawKey.slice(0, 100));
console.log("🔥 FIREBASE_PRIVATE_KEY tail:", rawKey.slice(-50));
console.log("🔥 containsRealNewline:", rawKey.includes("\n"));
console.log("🔥 containsEscapedNewline:", rawKey.includes("\\n"));
console.log("🔥 length:", rawKey.length);

const firebaseApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: rawKey
            .replace(/^"|"$/g, "")
            .replace(/\\n/g, "\n")
            .trim(),
        }),
      })
    : getApps()[0];

export const db = getFirestore(firebaseApp);
