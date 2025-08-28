// src/lib/check-ip.ts
import type { NextRequest } from "next/server";
import requestIp from "request-ip";
import { db } from "@/lib/firebase";

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

  // すでにIPv4ならそのまま
  if (ipv4Regex.test(ip)) return ip;

  // IPv6 → IPv4 変換を試みる
  try {
    const token = process.env.IPINFO_TOKEN;
    if (token && ip !== "UNKNOWN") {
      const res = await fetch(`https://ipinfo.io/${ip}?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ip && ipv4Regex.test(data.ip)) {
          return data.ip;
        }
      }
    }
  } catch (e) {
    console.error("IPv6 to IPv4 lookup failed:", e);
  }

  // fallback: IPv6をそのまま返す（UNKNOWNは返さない）
  return ip;
}
