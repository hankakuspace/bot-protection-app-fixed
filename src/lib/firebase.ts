// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    // 明示的に分かるエラーにしてデバッグしやすく
    throw new Error(`Missing env: ${name}`);
  }
  return v;
}

// ※ NEXT_PUBLIC_ のままでOK（サーバでも参照可）
const firebaseConfig = {
  apiKey: requireEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: requireEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// gRPCを避け、Serverlessで安定するRESTトランスポートを使用
let _db: Firestore;
try {
  _db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    preferRest: true, // ←これが重要
  });
} catch {
  // initializeFirestore が使えない環境でもフォールバック
  _db = getFirestore(app);
}

export const db = _db;
