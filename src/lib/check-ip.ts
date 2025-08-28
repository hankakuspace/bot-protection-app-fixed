// src/lib/check-ip.ts
import type { NextRequest } from "next/server";
import { db } from "@/lib/firebase";

/**
 * クライアントIPを正規化して取得
 * - 優先順: cf-connecting-ip → true-client-ip → x-forwarded-for → x-real-ip
 * - 複数ある場合は先頭を利用
 * - ::ffff: を除去
 * - IPv4を優先
 */
export function getClientIp(req: NextRequest): string {
  const headers = req.headers;
  const candidates: string[] = [];

  const cf = headers.get("cf-connecting-ip");
  const trueClient = headers.get("true-client-ip");
  const xff = headers.get("x-forwarded-for");
  const xri = headers.get("x-real-ip");

  if (cf) candidates.push(...cf.split(",").map((s) => s.trim()));
  if (trueClient) candidates.push(...trueClient.split(",").map((s) => s.trim()));
  if (xff) candidates.push(...xff.split(",").map((s) => s.trim()));
  if (xri) candidates.push(...xri.split(",").map((s) => s.trim()));

  // ::ffff: を外す
  const normalized = candidates.map((ip) =>
    ip.startsWith("::ffff:") ? ip.replace("::ffff:", "") : ip
  );

  // IPv4正規表現
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // IPv4 があれば優先
  const ipv4 = normalized.find((ip) => ipv4Regex.test(ip));
  if (ipv4) return ipv4;

  // 候補があればそのまま返す
  if (normalized.length > 0) return normalized[0];

  return "UNKNOWN";
}

/**
 * 指定されたIPがブロックされているかどうかを判定
 */
export async function isIpBlocked(ip: string): Promise<boolean> {
  try {
    const doc = await db.collection("blocked_ips").doc(ip).get();
    return doc.exists;
  } catch (e) {
    console.error("Error checking if IP is blocked:", e);
    return false;
  }
}

/**
 * IPをブロックリストに追加
 */
export async function blockIp(ip: string, reason: string = "manual"): Promise<void> {
  try {
    await db.collection("blocked_ips").doc(ip).set({
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
    await db.collection("blocked_ips").doc(ip).delete();
  } catch (e) {
    console.error("Error unblocking IP:", e);
  }
}
