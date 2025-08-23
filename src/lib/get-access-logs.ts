import { db } from "@/lib/admin";

/**
 * Firestore のアクセスログを取得
 * - timestamp の降順
 */
export async function getAccessLogs() {
  const snapshot = await db
    .collection("access_logs")
    .orderBy("timestamp", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
