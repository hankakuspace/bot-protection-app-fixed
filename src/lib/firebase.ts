// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, type Firestore } from 'firebase/firestore';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const firebaseConfig = {
  apiKey: requireEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: requireEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Web/Serverless で安定運用（undefined を無視）。REST 強制は不要なので外す
let _db: Firestore;
try {
  _db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    // experimentalAutoDetectLongPolling: true, // 必要ならコメント解除（ブラウザでの接続安定化）
  });
} catch {
  _db = getFirestore(app);
}

export const db = _db;
export default app;
