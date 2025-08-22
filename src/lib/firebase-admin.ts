import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!process.env.FIREBASE_PROJECT_ID) {
  throw new Error("Missing env: FIREBASE_PROJECT_ID");
}
if (!process.env.FIREBASE_CLIENT_EMAIL) {
  throw new Error("Missing env: FIREBASE_CLIENT_EMAIL");
}
if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error("Missing env: FIREBASE_PRIVATE_KEY");
}

// 方法B: Vercel ダッシュボードに複数行のまま保存したキーをそのまま利用
// replace(/\\n/g, "\n") は不要
const firebaseAdminApp =
  getApps()[0] ||
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }),
  });

export const db = getFirestore(firebaseAdminApp);
export default firebaseAdminApp;
