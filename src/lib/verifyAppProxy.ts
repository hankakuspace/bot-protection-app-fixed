import crypto from "crypto";

/**
 * Shopify App Proxy の署名検証（+ timestamp 鮮度チェック）
 * 仕様ポイント：
 * - signature を除く全クエリを「key=value」化し、キー昇順ソート、区切りなしで連結
 * - 同一キーの複数値は "," で連結（value1,value2）
 * - HMAC-SHA256（hex, 低レベル比較）
 */
export function verifyAppProxySignature(
  url: URL,
  appSecret: string,
  maxAgeSeconds: number = 300
): { ok: boolean; reason?: string; debug?: any } {
  const search = url.search.startsWith("?") ? url.search.slice(1) : url.search;
  const params = new URLSearchParams(search);

  const signature = params.get("signature");
  if (!signature) return { ok: false, reason: "missing signature" };

  // timestamp 鮮度チェック（±maxAgeSeconds）
  const ts = parseInt(params.get("timestamp") || "0", 10);
  const now = Math.floor(Date.now() / 1000);
  if (!ts || Math.abs(now - ts) > maxAgeSeconds) {
    return { ok: false, reason: "timestamp expired or invalid", debug: { ts, now } };
  }

  // signature 以外のパラメータを取りまとめ（複数値は "," で連結）
  const map = new Map<string, string[]>();
  for (const [k, v] of params.entries()) {
    if (k === "signature") continue;
    const arr = map.get(k);
    if (arr) arr.push(v);
    else map.set(k, [v]);
  }
  const parts = Array.from(map.entries()).map(([k, vs]) => `${k}=${vs.join(",")}`);

  // キー昇順ソート & 区切りなしで連結
  const message = parts.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).join("");

  const digest = crypto.createHmac("sha256", appSecret).update(message, "utf8").digest("hex");
  const ok =
    signature.length > 0 &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));

  return {
    ok,
    reason: ok ? undefined : "invalid signature",
    debug: {
      constructedMessage: message,
      calculatedDigest: digest,
      signatureFromShopify: signature,
      ts,
      now,
    },
  };
}
