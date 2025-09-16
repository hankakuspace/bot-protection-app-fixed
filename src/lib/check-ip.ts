// src/lib/check-ip.ts
import { adminDb } from "@/lib/firebase";

// ✅ クライアントIP取得（Cloudflare専用: cf-connecting-ip を必ず利用）
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

// ✅ 管理者IP判定（IPv6 /64 プレフィックス対応）
export async function isAdminIp(ip: string): Promise<boolean> {
  if (!ip) return false;

  const snapshot = await adminDb.collection("admin_ips").get();
  // Firestoreの保存形式に合わせて doc.id or doc.data().ip を考慮
  const adminIps = snapshot.docs.map((doc) => doc.id || doc.data().ip);

  console.log("🔥 DEBUG isAdminIp check", { requestIp: ip, adminIps });

  const normalizedIp = ip.replace(/^::ffff:/, "");

  return adminIps.some((adminIpRaw) => {
    if (!adminIpRaw) return false;
    const adminIp = String(adminIpRaw);

    // ✅ IPv6 /64 プレフィックス登録に対応
    if (adminIp.includes("/64")) {
      const prefixAdmin = adminIp.replace("/64", "").replace(/:+$/, "");
      const prefixReq = normalizedIp.split(":").slice(0, 4).join(":");
      return prefixReq.startsWith(prefixAdmin);
    }

    // ✅ IPv6同士なら先頭4ブロックで比較
    if (normalizedIp.includes(":") && adminIp.includes(":")) {
      const prefixReq = normalizedIp.split(":").slice(0, 4).join(":");
      const prefixAdmin = adminIp.split(":").slice(0, 4).join(":");
      return prefixReq === prefixAdmin;
    }

    // ✅ IPv4は完全一致
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
