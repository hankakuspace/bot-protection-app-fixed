// src/utils/firebaseAdmin.ts
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp({ credential: applicationDefault() });
}

const db = getFirestore();

export const addToBlacklist = async (ip: string) => {
  await db.collection('blacklist').doc(ip).set({ createdAt: new Date() });
};
