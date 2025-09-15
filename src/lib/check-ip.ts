// src/lib/check-ip.ts
import type { NextRequest } from "next/server";
import requestIp from "request-ip";
import { adminDb } from "@/lib/firebase";

/**
 * クライアントIPを正規化して取得（必ずIPv4優先。なければIPv6を保存）
 */
export async function getClientIp(req: NextRequest): Promise<string> {
  const headers = req.headers;

  const cf = headers.get("cf-connecting-ip");
  const shopify = headers.get("x-shopify-client-ip");
  const xff = headers.get("x-forwarded-for")?.split(",")[0].trim();
  const xri = headers.get("x-real-ip");

  let ip =
    cf ||
    shopify ||
    xff ||
    xri ||
    requestIp.getClientIp(req as any) ||
    "UNKNOWN";

  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  // IPv4正規表現
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // すでにIPv4ならそのまま返す
  if (ipv4Regex.test(ip)) return ip;

  // IPv6を持っている場合 → ipinfoで変換を試みる
  try {
    const token = process.env.IPINFO_TOKEN;
    if (token && ip !== "UNKNOWN") {
      const res = await fetch(`https://ipinfo.io/${ip}?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ip && ipv4Regex.test(data.ip)) {
          return data.ip; // 変換成功
        }
      }
    }
  } catch (e) {
    console.error("IPv6 to IPv4 lookup failed:", e);
  }

  // fallback: IPv6をそのまま返す（UNKNOWNは返さない）
  return ip;
}

/**
 * 指定されたIPがブロックされているかどうかを判定
 */
export async function isIpBlocked(ip: string): Promise<boolean> {
  try {
    const doc = await adminDb.collection("block_ips").doc(ip).get();
    return doc.exists;
  } catch (e) {
    console.error("Error checking if IP is blocked:", e);
    return false;
  }
}

/**
 * 管理者IPかどうかを判定（デバッグログ付き）
 */
export async function isAdminIp(ip: string): Promise<boolean> {
  try {
    const snap = await adminDb.collection("admin_ips").get();
    const normalized = ip.trim().toLowerCase();

    let result = false;

    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (!data.ip) return;
      const target = String(data.ip)
        .replace(/^"+|"+$/g, "")
        .trim()
        .toLowerCase();

      // ✅ デバッグログ
      console.log("DEBUG isAdminIp compare:", { normalized, target });

      if (
        target === normalized ||
        target.startsWith(normalized) ||
        normalized.startsWith(target)
      ) {
        result = true;
      }
    });

    return result;
  } catch (e) {
    console.error("Error checking if IP is admin:", e);
    return false;
  }
}


/**
 * IPをブロックリストに追加
 */
export async function blockIp(ip: string, reason: string = "manual"): Promise<void> {
  try {
    await adminDb.collection("block_ips").doc(ip).set({
      blocked: true,
      reason,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Error blocking IP:", e);
  }
}

/**
 * IPをブロックリストから解除
 */
export async function unblockIp(ip: string, reason: string = "manual"): Promise<void> {
  try {
    await adminDb.collection("block_ips").doc(ip).delete();
  } catch (e) {
    console.error("Error unblocking IP:", e);
  }
}
