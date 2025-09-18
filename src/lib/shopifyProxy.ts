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
  computed?: string;
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

/**
 * クライアントIP抽出
 * - ip: 実際に判定したIP
 * - xff: X-Forwarded-For ヘッダ値（あれば）
 * - realIp: X-Real-IP ヘッダ値（あれば）
 */
export function extractClientIp(req: NextRequest | { headers: Headers }): {
  ip: string;
  xff?: string | null;
  realIp?: string | null;
} {
  const headers = (req as any).headers as Headers;

  const xff = headers?.get?.("x-forwarded-for") ?? null;
  const realIp = headers?.get?.("x-real-ip") ?? null;

  let ip = "0.0.0.0";
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) ip = first.replace(/^::ffff:/, "");
  } else if (realIp) {
    ip = realIp.replace(/^::ffff:/, "");
  } else if ((req as any)?.ip) {
    ip = (req as any).ip;
  }

  return { ip, xff, realIp };
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
