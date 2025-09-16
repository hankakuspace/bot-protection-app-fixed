// src/lib/check-ip.ts
import { adminDb } from "@/lib/firebase";

export function getClientIp(req: any): string {
  let ip = req.headers.get("cf-connecting-ip") || "";

  if (!ip) {
    const forwarded = req.headers.get("x-forwarded-for");
    ip = forwarded ? forwarded.split(",")[0].trim() : req.ip ?? "";
  }

  if (ip && ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return ip;
}

// ✅ 管理者IP判定（IPv6 /64対応強化版）
export async function isAdminIp(ip: string): Promise<boolean> {
  if (!ip) return false;

  const snapshot = await adminDb.collection("admin_ips").get();
  const adminIps = snapshot.docs.map((doc) => doc.data().ip as string);

  console.log("🔥 DEBUG isAdminIp check", { requestIp: ip, adminIps });

  const normalizedIp = ip.replace(/^::ffff:/, "");

  return adminIps.some((adminIp) => {
    if (!adminIp) return false;

    // ✅ IPv6 /64 プレフィックス登録の場合
    if (adminIp.endsWith("/64")) {
      const prefixAdmin = adminIp.replace("/64", "").replace(/:+$/, "");
      const prefixReq = normalizedIp.split(":").slice(0, 4).join(":");
      return prefixReq === prefixAdmin;
    }

    // ✅ IPv6同士なら先頭4ブロック比較
    if (normalizedIp.includes(":") && adminIp.includes(":")) {
      const prefixReq = normalizedIp.split(":").slice(0, 4).join(":");
      const prefixAdmin = adminIp.split(":").slice(0, 4).join(":");
      return prefixReq === prefixAdmin;
    }

    // ✅ IPv4は完全一致
    return normalizedIp === adminIp;
  });
}

export async function isIpBlocked(ip: string): Promise<boolean> {
  if (!ip) return false;
  const ref = adminDb.collection("blocked_ips").doc(ip);
  const doc = await ref.get();
  return doc.exists;
}

export async function blockIp(ip: string, source: string = "manual"): Promise<void> {
  if (!ip) return;
  await adminDb.collection("blocked_ips").doc(ip).set({
    createdAt: new Date().toISOString(),
    source,
  });
}

export async function unblockIp(ip: string, source: string = "manual"): Promise<void> {
  if (!ip) return;
  await adminDb.collection("blocked_ips").doc(ip).delete();
}
