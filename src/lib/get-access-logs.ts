// src/lib/get-access-logs.ts
import { adminDb } from "@/lib/firebase";

/**
 * Firestore のアクセスログを取得
 * - timestamp の降順
 */
export async function getAccessLogs() {
  const snapshot = await adminDb
    .collection("access_logs")
    .orderBy("timestamp", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
