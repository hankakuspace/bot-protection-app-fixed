import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

const BLOCKED_COLLECTION = "blocked_ips";

/**
 * IP一覧を取得
 */
export async function listIps(): Promise<string[]> {
  const snapshot = await getDocs(collection(db, BLOCKED_COLLECTION));
  return snapshot.docs.map((doc) => doc.id);
}

/**
 * IPを追加
 */
export async function addIp(ip: string): Promise<void> {
  await setDoc(doc(db, BLOCKED_COLLECTION, ip), {
    createdAt: new Date().toISOString(),
  });
}

/**
 * IPを削除
 */
export async function removeIp(ip: string): Promise<void> {
  await deleteDoc(doc(db, BLOCKED_COLLECTION, ip));
}

/**
 * 複数IPをセット（全上書き）
 */
export async function setIps(ips: string[]): Promise<void> {
  // 既存を全削除 → 新しいリストを追加
  const snapshot = await getDocs(collection(db, BLOCKED_COLLECTION));
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));

  await Promise.all(
    ips.map((ip) =>
      setDoc(doc(db, BLOCKED_COLLECTION, ip), {
        createdAt: new Date().toISOString(),
      })
    )
  );
}
