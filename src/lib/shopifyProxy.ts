// src/lib/shopifyProxy.ts
import crypto from "crypto";
import type { NextRequest } from "next/server";

/** 署名対象のキーから signature を除外し、キー昇順で key=value を & 連結 */
export function buildCanonicalQuery(
  params: URLSearchParams | Record<string, string | null | undefined>
): string {
  const obj: Record<string, string> = {};
  if (params instanceof URLSearchParams) {
    params.forEach((v, k) => {
      if (k !== "signature" && v !== undefined && v !== null) obj[k] = v;
    });
  } else {
    for (const [k, v] of Object.entries(params)) {
      if (k !== "signature" && v !== undefined && v !== null) obj[k] = String(v);
    }
  }
  const keys = Object.keys(obj).sort(); // 昇順
  return keys.map((k) => `${k}=${obj[k]}`).join("&");
}

/** HMAC-SHA256(hex) */
export function hmacHex(input: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(input).digest("hex");
}

/** App Proxy の署名検証 */
export function verifyAppProxySignature(
  params: URLSearchParams,
  secret: string
): { match: boolean; provided?: string; calculated?: string; canonical: string } {
  const provided = params.get("signature") || "";
  const canonical = buildCanonicalQuery(params);
  const calculated = hmacHex(canonical, secret);
  return { match: provided === calculated, provided, calculated, canonical };
}

/** クライアントIP抽出（x-forwarded-for 最優先） */
export function extractClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first.replace(/^::ffff:/, "");
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.replace(/^::ffff:/, "");
  return (req as any)?.ip ?? "0.0.0.0";
}

/** デバッグ許可（DEBUG_PROXY=1 のときだけ true） */
export function isDebugEnabled(): boolean {
  return (process.env.DEBUG_PROXY ?? "") === "1";
}
