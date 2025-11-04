// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDA-rq7i14WPvKQpL0n64hWRK4HjQCt-io",
  authDomain: "bot-protection-6218f.firebaseapp.com",
  projectId: "bot-protection-6218f",
  storageBucket: "bot-protection-6218f.appspot.com",
  messagingSenderId: "710443136276",
  appId: "1:710443136276:web:fd94f0e1201070f9643e01",
};

// ✅ すでに初期化済みであれば再利用（Vercelビルドで二重初期化防止）
export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Firestore インスタンス
export const db = getFirestore(app);
