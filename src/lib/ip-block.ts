// src/lib/ip-block.ts
import { adminDb } from "@/lib/firebase";
import admin from "firebase-admin";

/**
 * 指定されたIPがブロック対象かどうか判定
 */
export async function isIpBlocked(ip: string): Promise<boolean> {
  const snap = await adminDb.collection("blocked_ips").doc(ip).get();
  return snap.exists;
}

/**
 * IPをブロックリストに追加
 */
export async function blockIp(ip: string, note?: string): Promise<void> {
  await adminDb.collection("blocked_ips").doc(ip).set({
    ip,
    note: note || "",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * IPをブロックリストから削除
 */
export async function unblockIp(ip: string): Promise<void> {
  await adminDb.collection("blocked_ips").doc(ip).delete();
}
