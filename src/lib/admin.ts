// src/lib/admin.ts
import admin from "firebase-admin";

// Firebase Admin SDK 初期化
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export const db = admin.firestore();
const COLL = "admin_ips";

/**
 * 指定されたIPが管理者として登録されているか判定
 */
export async function isAdminIp(ip: string): Promise<boolean> {
  if (!ip) return false;
  const qSnap = await db.collection(COLL).where("ip", "==", ip).get();
  return !qSnap.empty;
}

/**
 * 管理者IPを追加
 */
export async function addAdminIp(ip: string, source: string = "manual"): Promise<void> {
  if (!ip) return;
  await db.collection(COLL).add({ ip, source });
}

/**
 * 管理者IP一覧を取得
 */
export async function listAdminIps(): Promise<string[]> {
  const snapshot = await db.collection(COLL).get();
  return snapshot.docs.map((doc) => doc.data().ip as string);
}

/**
 * 管理者IPを削除
 */
export async function removeAdminIp(ip: string): Promise<void> {
  if (!ip) return;
  const snapshot = await db.collection(COLL).where("ip", "==", ip).get();
  const batch = db.batch();
  snapshot.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}
