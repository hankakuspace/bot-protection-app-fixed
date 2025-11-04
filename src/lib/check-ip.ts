// src/lib/check-ip.ts
import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function isIpBlocked(ip: string): Promise<boolean> {
  const colRef = collection(db, 'blocked_ips');
  const q = query(colRef, where('ip', '==', ip));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}
