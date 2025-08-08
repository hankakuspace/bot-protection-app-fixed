import { db } from './firebase';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';

const COLL = 'blocked_ips';

/**
 * 現在ブロック対象か（Firestoreを直接クエリ）
 */
export async function isIpBlocked(ip: string): Promise<boolean> {
  const colRef = collection(db, COLL);
  const q = query(colRef, where('ip', '==', ip));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * 指定IPをブラックリストへ追加（重複登録はスキップ）
 */
export async function blockIp(ip: string, reason: string = 'manual'): Promise<void> {
  if (!ip) return;
  const exists = await isIpBlocked(ip);
  if (exists) return;

  const colRef = collection(db, COLL);
  await addDoc(colRef, {
    ip,
    reason,
    createdAt: Date.now(),
  });
}

/**
 * 指定IPをブラックリストから削除（同IPが複数あれば全削除）
 */
export async function unblockIp(ip: string): Promise<void> {
  if (!ip) return;
  const colRef = collection(db, COLL);
  const qSnap = await getDocs(query(colRef, where('ip', '==', ip)));
  const deletions = qSnap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(deletions);
}
