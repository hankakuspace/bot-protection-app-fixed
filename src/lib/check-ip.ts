// src/lib/check-ip.ts
import type { NextRequest } from "next/server";

/**
 * クライアントIPを正規化して取得
 * - ヘッダ優先順: cf-connecting-ip → x-forwarded-for → x-real-ip
 * - 複数IPがある場合は IPv4 を優先して返す
 * - ::ffff:xxx.xxx.xxx.xxx は IPv4 として扱う
 */
export function getClientIp(req: NextRequest): string {
  const headers = req.headers;

  const candidates: string[] = [];

  const cf = headers.get("cf-connecting-ip");
  const xff = headers.get("x-forwarded-for");
  const xri = headers.get("x-real-ip");

  if (cf) candidates.push(...cf.split(",").map((s) => s.trim()));
  if (xff) candidates.push(...xff.split(",").map((s) => s.trim()));
  if (xri) candidates.push(...xri.split(",").map((s) => s.trim()));

  // ::ffff: を外す
  const normalized = candidates.map((ip) =>
    ip.startsWith("::ffff:") ? ip.replace("::ffff:", "") : ip
  );

  // IPv4正規表現
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // ✅ IPv4 があれば優先して返す
  const ipv4 = normalized.find((ip) => ipv4Regex.test(ip));
  if (ipv4) return ipv4;

  // IPv4 が無ければ最初の候補（IPv6など）を返す
  if (normalized.length > 0) return normalized[0];

  return "UNKNOWN";
}
