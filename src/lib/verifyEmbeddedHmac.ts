// src/lib/verifyEmbeddedHmac.ts
import crypto from "crypto";

export function verifyEmbeddedHmac(
  params: URLSearchParams,
  secret: string,
  maxAgeSeconds: number = 300 // 5分
): { ok: boolean; reason?: string; debug?: any } {
  const hmac = params.get("hmac");
  if (!hmac) return { ok: false, reason: "missing hmac" };

  // timestamp チェック
  const ts = parseInt(params.get("timestamp") || "0", 10);
  const now = Math.floor(Date.now() / 1000);
  if (!ts || Math.abs(now - ts) > maxAgeSeconds) {
    return { ok: false, reason: "timestamp expired", debug: { ts, now } };
  }

  // hmac以外をソートしてクエリ文字列を生成
  const query = Array.from(params.entries())
    .filter(([k]) => k !== "hmac")
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const digest = crypto.createHmac("sha256", secret).update(query).digest("hex");

  const ok = digest === hmac;

  return {
    ok,
    reason: ok ? undefined : "invalid hmac",
    debug: { query, digest, hmacFromShopify: hmac, ts, now },
  };
}
