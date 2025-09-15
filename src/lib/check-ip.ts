// src/lib/check-ip.ts
import { adminDb } from "@/lib/firebase";

// ✅ クライアントIP正規化
export function getClientIp(req: any): string {
  const forwarded = req.headers.get("x-forwarded-for");
  let ip = forwarded ? forwarded.split(",")[0].trim() : req.ip ?? "";
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }
  return ip;
}

// ✅ 管理者IP判定
export async function isAdminIp(ip: string): Promise<boolean> {
  if (!ip) return false;

  // Firestoreの admin_ips コレクションを取得
  const snapshot = await adminDb.collection("admin_ips").get();
  const adminIps = snapshot.docs.map((doc) => doc.id);

  // デバッグログ
  console.log("🔥 DEBUG isAdminIp check", { requestIp: ip, adminIps });

  // IPv4-mapped IPv6 を正規化
  const normalizedIp = ip.replace(/^::ffff:/, "");

  return adminIps.some((adminIp) => {
    // IPv6同士なら /64 プレフィックス比較
    if (normalizedIp.includes(":") && adminIp.includes(":")) {
      const prefixReq = normalizedIp.split(":").slice(0, 4).join(":");
      const prefixAdmin = adminIp.split(":").slice(0, 4).join(":");
      return prefixReq === prefixAdmin;
    }
    // IPv4なら完全一致
    return normalizedIp === adminIp;
  });
}

// ✅ ブロックIP判定
export async function isIpBlocked(ip: string): Promise<boolean> {
  if (!ip) return false;
  const ref = adminDb.collection("blocked_ips").doc(ip);
  const doc = await ref.get();
  return doc.exists;
}
