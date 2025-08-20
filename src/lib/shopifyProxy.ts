import crypto from "crypto";
import type { NextRequest } from "next/server";

/**
 * canonical query を構築する
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

/**
 * App Proxy の署名検証
 */
export function verifyAppProxySignature(
  params: URLSearchParams | Record<string, string>,
  secret: string
): {
  ok: boolean;
  match: boolean;
  provided?: string;
  computed?: string;     // ← 名前を「computed」に変更
  canonical: string;
} {
  let provided = "";
  let canonical = "";

  if (params instanceof URLSearchParams) {
    provided = params.get("signature") || "";
    canonical = buildCanonicalQuery(params);
  } else {
    provided = params["signature"] || "";
    canonical = buildCanonicalQuery(params);
  }

  const computed = hmacHex(canonical, secret);
  const match = provided === computed;

  return { ok: match, match, provided, computed, canonical };
}

/** クライアントIP抽出 */
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
