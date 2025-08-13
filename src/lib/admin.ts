// src/lib/admin.ts
import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

const COLL = 'admin_ips';

/** このIPが管理者か？（Firestore直クエリ） */
export async function isAdminIp(ip: string): Promise<boolean> {
  if (!ip) return false;
  const qSnap = await getDocs(query(collection(db, COLL), where('ip', '==', ip)));
  return !qSnap.empty;
}

/** 管理者IPを追加（重複はスキップ） */
export async function addAdminIp(ip: string, note: string = 'manual'): Promise<void> {
  if (!ip) return;
  if (await isAdminIp(ip)) return;
  await addDoc(collection(db, COLL), {
    ip,
    note,
    createdAt: Date.now(),
  });
}

/** 管理者IPを削除（同一IPが複数あれば全削除） */
export async function removeAdminIp(ip: string): Promise<void> {
  if (!ip) return;
  const qSnap = await getDocs(query(collection(db, COLL), where('ip', '==', ip)));
  await Promise.all(qSnap.docs.map((d) => deleteDoc(d.ref)));
}

/** 管理者IP一覧を返す（必要ならUI用） */
export async function listAdminIps(): Promise<string[]> {
  const snap = await getDocs(collection(db, COLL));
  return snap.docs.map((d) => (d.data() as any).ip).filter(Boolean);
}
