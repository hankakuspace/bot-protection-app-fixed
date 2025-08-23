import { db } from "@/lib/admin";

const BLOCKED_COLLECTION = "blocked_ips";

/**
 * IP一覧を取得
 */
export async function listIps(): Promise<string[]> {
  const snapshot = await db.collection(BLOCKED_COLLECTION).get();
  return snapshot.docs.map((doc) => doc.id);
}

/**
 * IPを追加
 */
export async function addIp(ip: string, source: string = "manual"): Promise<void> {
  if (!ip) return;
  await db.collection(BLOCKED_COLLECTION).doc(ip).set({
    createdAt: new Date().toISOString(),
    source,
  });
}

/**
 * IPを削除
 */
export async function removeIp(ip: string): Promise<void> {
  if (!ip) return;
  await db.collection(BLOCKED_COLLECTION).doc(ip).delete();
}

/**
 * 複数IPをセット（全上書き）
 */
export async function setIps(ips: string[], source: string = "manual"): Promise<void> {
  // 既存を全削除 → 新しいリストを追加
  const snapshot = await db.collection(BLOCKED_COLLECTION).get();
  const batch = db.batch();
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  const newBatch = db.batch();
  ips.forEach((ip) => {
    const ref = db.collection(BLOCKED_COLLECTION).doc(ip);
    newBatch.set(ref, {
      createdAt: new Date().toISOString(),
      source,
    });
  });
  await newBatch.commit();
}
