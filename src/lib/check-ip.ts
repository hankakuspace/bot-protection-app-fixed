// src/lib/check-ip.ts
import { adminDb } from "@/lib/firebase";

// ✅ クライアントIP正規化（IPv4優先）
export function getClientIp(req: any): string {
  // Cloudflare 経由の場合は cf-connecting-ip を優先
  let ip = req.headers.get("cf-connecting-ip") || "";

  // fallback: x-forwarded-for → req.ip
  if (!ip) {
    const forwarded = req.headers.get("x-forwarded-for");
    ip = forwarded ? forwarded.split(",")[0].trim() : req.ip ?? "";
  }

  if (ip && ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  // ✅ IPv6が来ている場合でも、x-forwarded-for/forwarded に IPv4 があればそちらを優先
  if (ip.includes(":")) {
    const forwarded = req.headers.get("x-forwarded-for") || req.headers.get("forwarded");
    if (forwarded) {
      const ipv4Candidate = forwarded
        .split(/[ ,]/) // カンマ or スペース区切り
        .find((addr: string) => addr.match(/\d+\.\d+\.\d+\.\d+/));
      if (ipv4Candidate) {
        ip = ipv4Candidate.replace("for=", "").trim();
      }
    }
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

// ✅ 指定IPをブロックリストに追加（呼び出し元をオプション保存）
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
