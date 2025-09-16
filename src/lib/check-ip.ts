// src/lib/check-ip.ts
import { adminDb } from "@/lib/firebase";

// ✅ クライアントIP取得（Cloudflare専用: cf-connecting-ip を必ず利用）
export function getClientIp(req: any): string {
  // Cloudflareが付与するオリジナルのクライアントIPを信頼
  let ip = req.headers.get("cf-connecting-ip") || "";

  // fallback: 念のため（通常は不要）
  if (!ip) {
    const forwarded = req.headers.get("x-forwarded-for");
    ip = forwarded ? forwarded.split(",")[0].trim() : req.ip ?? "";
  }

  // IPv4-mapped IPv6 を正規化
  if (ip && ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return ip;
}

// ✅ 管理者IP判定
export async function isAdminIp(ip: string): Promise<boolean> {
  if (!ip) return false;

  const snapshot = await adminDb.collection("admin_ips").get();
  const adminIps = snapshot.docs.map((doc) => doc.id);

  console.log("🔥 DEBUG isAdminIp check", { requestIp: ip, adminIps });

  const normalizedIp = ip.replace(/^::ffff:/, "");

  return adminIps.some((adminIp) => {
    if (normalizedIp.includes(":") && adminIp.includes(":")) {
      const prefixReq = normalizedIp.split(":").slice(0, 4).join(":");
      const prefixAdmin = adminIp.split(":").slice(0, 4).join(":");
      return prefixReq === prefixAdmin;
    }
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

// ✅ 指定IPをブロックリストに追加
export async function blockIp(ip: string, source: string = "manual"): Promise<void> {
  if (!ip) return;
  await adminDb.collection("blocked_ips").doc(ip).set({
    createdAt: new Date().toISOString(),
    source,
  });
}

// ✅ 指定IPをブロックリストから解除
export async function unblockIp(ip: string, source: string = "manual"): Promise<void> {
  if (!ip) return;
  await adminDb.collection("blocked_ips").doc(ip).delete();
}
