import crypto from "crypto";
import type { NextRequest } from "next/server";

/**
 * canonical query を構築する
 * - signature パラメータは除外
 * - キーは昇順ソート
 * - 値が複数ある場合はカンマ区切りで結合
 * - 区切り文字（&）は使わず、連続して結合
 */
export function buildCanonicalQuery(
  params: URLSearchParams | Record<string, string | null | undefined>
): string {
  const obj: Record<string, string[]> = {};

  if (params instanceof URLSearchParams) {
    params.forEach((v, k) => {
      if (k !== "signature" && v !== undefined && v !== null) {
        if (!obj[k]) obj[k] = [];
        obj[k].push(v);
      }
    });
  } else {
    for (const [k, v] of Object.entries(params)) {
      if (k !== "signature" && v !== undefined && v !== null) {
        if (!obj[k]) obj[k] = [];
        obj[k].push(String(v));
      }
    }
  }

  const keys = Object.keys(obj).sort();
  return keys.map((k) => `${k}=${obj[k].join(",")}`).join("");
}

/** HMAC-SHA256(hex) */
export function hmacHex(input: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(input).digest("hex");
}

/** App Proxy の署名検証 */
export function verifyAppProxySignature(
  params: URLSearchParams,
  secret: string
): {
  match: boolean;
  provided?: string;
  calculated?: string;
  canonical: string;
} {
  const provided = params.get("signature") || "";
  const canonical = buildCanonicalQuery(params);
  const calculated = hmacHex(canonical, secret);
  return { match: provided === calculated, provided, calculated, canonical };
}

/** クライアントIP抽出（x-forwarded-for 優先） */
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

/** デバッグモード判定 */
export function isDebugEnabled(): boolean {
  return (process.env.DEBUG_PROXY ?? "") === "1";
}

/** URLSearchParams → オブジェクト */
export function paramsToObject(params: URLSearchParams): Record<string, string> {
  const obj: Record<string, string> = {};
  params.forEach((v, k) => {
    obj[k] = v;
  });
  return obj;
}
