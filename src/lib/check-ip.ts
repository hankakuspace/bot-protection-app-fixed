import { db } from "@/lib/admin"; // admin SDK を利用
import { isAdminIp } from "@/lib/admin";

/**
 * 管理者判定 & ブロック判定
 */
export async function checkIp(ip: string) {
  if (!ip) {
    return { ip, blocked: false, isAdmin: false };
  }

  // 🔹 admin SDK で blocked 判定
  const blockedSnap = await db.collection("blocked_ips").doc(ip).get();
  const blocked = blockedSnap.exists;

  // 🔹 admin SDK で管理者判定（共通関数利用）
  const isAdmin = await isAdminIp(ip);

  return {
    ip,
    blocked,
    isAdmin,
  };
}

/**
 * 単純にブロックされているか確認
 */
export async function isIpBlocked(ip: string): Promise<boolean> {
  if (!ip) return false;
  const snap = await db.collection("blocked_ips").doc(ip).get();
  return snap.exists;
}

/**
 * IP をブロックリストに追加（呼び出し元の記録オプション付き）
 */
export async function blockIp(ip: string, source: string = "manual"): Promise<void> {
  if (!ip) return;
  await db.collection("blocked_ips").doc(ip).set({
    createdAt: new Date().toISOString(),
    source,
  });
}

/**
 * IP をブロックリストから解除（呼び出し元の記録オプション付き）
 */
export async function unblockIp(ip: string, source: string = "manual"): Promise<void> {
  if (!ip) return;
  await db.collection("blocked_ips").doc(ip).delete();
  // TODO: 削除ログ保存処理を追加したい場合はここに実装
}
