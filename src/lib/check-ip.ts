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

// ✅ 管理者IP判定（IPv6 /64対応、IPv4は完全一致のみ）
export async function isAdminIp(ip: string): Promise<boolean> {
  if (!ip) return false;

  const snapshot = await adminDb.collection("admin_ips").get();
  const adminIps = snapshot.docs.map((doc) => doc.data().ip as string);

  console.log("🔥 DEBUG isAdminIp check", { requestIp: ip, adminIps });

  const normalizedIp = ip.replace(/^::ffff:/, "");

  return adminIps.some((adminIp) => {
    if (!adminIp) return false;

    // IPv4 同士 → 完全一致のみ
    if (normalizedIp.includes(".") && adminIp.includes(".")) {
      return normalizedIp === adminIp;
    }

    // IPv6 /64 プレフィックス登録の場合
    if (adminIp.endsWith("/64") && normalizedIp.includes(":")) {
      const prefixAdmin = adminIp.replace("/64", "").replace(/:+$/, "");
      const prefixReq = normalizedIp.split(":").slice(0, 4).join(":");
      return prefixReq === prefixAdmin;
    }

    // IPv6 同士 → 先頭4ブロック比較
    if (normalizedIp.includes(":") && adminIp.includes(":")) {
      const prefixReq = normalizedIp.split(":").slice(0, 4).join(":");
      const prefixAdmin = adminIp.split(":").slice(0, 4).join(":");
      return prefixReq === prefixAdmin;
    }

    return false;
  });
}

// ✅ ブロックIP判定（IPv6 /64対応、IPv4は完全一致のみ）
export async function isIpBlocked(ip: string): Promise<boolean> {
  if (!ip) return false;

  const snapshot = await adminDb.collection("blocked_ips").get();
  const blockedIps = snapshot.docs.map((doc) => doc.data().ip as string);

  console.log("🔥 DEBUG isIpBlocked check", { requestIp: ip, blockedIps });

  const normalizedIp = ip.replace(/^::ffff:/, "");

  return blockedIps.some((blockedIp) => {
    if (!blockedIp) return false;

    // IPv4 同士 → 完全一致のみ
    if (normalizedIp.includes(".") && blockedIp.includes(".")) {
      return normalizedIp === blockedIp;
    }

    // IPv6 /64 プレフィックス登録の場合
    if (blockedIp.endsWith("/64") && normalizedIp.includes(":")) {
      const prefixBlocked = blockedIp.replace("/64", "").replace(/:+$/, "");
      const prefixReq = normalizedIp.split(":").slice(0, 4).join(":");
      return prefixReq === prefixBlocked;
    }

    // IPv6 同士 → 先頭4ブロック比較
    if (normalizedIp.includes(":") && blockedIp.includes(":")) {
      const prefixReq = normalizedIp.split(":").slice(0, 4).join(":");
      const prefixBlocked = blockedIp.split(":").slice(0, 4).join(":");
      return prefixReq === prefixBlocked;
    }

    return false;
  });
}

// ✅ 国ブロック判定（Firestoreの blocked_countries の countryCode フィールドで検索）
export async function isCountryBlocked(country: string): Promise<boolean> {
  if (!country) return false;

  try {
    const snapshot = await adminDb
      .collection("blocked_countries")
      .where("countryCode", "==", country)
      .limit(1)
      .get();

    return !snapshot.empty; // ← 存在すればブロック
  } catch (err) {
    console.error("isCountryBlocked error:", err);
    return false;
  }
}

export async function blockIp(
  ip: string,
  source: string = "manual"
): Promise<void> {
  if (!ip) return;
  await adminDb.collection("blocked_ips").doc(ip).set({
    createdAt: new Date().toISOString(),
    source,
  });
}

export async function unblockIp(
  ip: string,
  source: string = "manual"
): Promise<void> {
  if (!ip) return;
  await adminDb.collection("blocked_ips").doc(ip).delete();
}
