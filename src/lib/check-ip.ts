// すでにある import と型定義・checkIpAndLog はそのまま残しつつ、下の3関数を追加

import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';

// 既存の定数を使う or 無ければ定義
const COLL_BLOCKED_IPS = 'blocked_ips';

// --- ここから追加: 管理UIで使うユーティリティ3関数 ---

// 現在ブロック対象か（Firestoreを直接クエリ）
export async function isIpBlocked(ip: string): Promise<boolean> {
  if (!ip) return false;
  const colRef = collection(db, COLL_BLOCKED_IPS);
  const q = query(colRef, where('ip', '==', ip));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

// 指定IPをブラックリストへ追加（重複登録はスキップ）
export async function blockIp(ip: string, reason: string = 'manual'): Promise<void> {
  if (!ip) return;
  const exists = await isIpBlocked(ip);
  if (exists) return;

  const colRef = collection(db, COLL_BLOCKED_IPS);
  await addDoc(colRef, {
    ip,
    reason,
    createdAt: Date.now(),
  });
}

// 指定IPをブラックリストから削除（同IPが複数あれば全削除）
export async function unblockIp(ip: string): Promise<void> {
  if (!ip) return;
  const colRef = collection(db, COLL_BLOCKED_IPS);
  const qSnap = await getDocs(query(colRef, where('ip', '==', ip)));
  const deletions = qSnap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletions);
}

// --- ここまで追加 ---

// （既存）checkIpAndLog などはそのまま
