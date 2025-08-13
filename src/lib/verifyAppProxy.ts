import crypto from "crypto";

export function verifyAppProxySignature(
  url: URL,
  appSecret: string
): { ok: boolean; reason?: string; debug?: any } {
  const params = new URLSearchParams(url.search);
  const signature = params.get("signature");
  if (!signature) return { ok: false, reason: "missing signature" };

  // 署名以外を取り出してソート & 連結（URLエンコードなし）
  params.delete("signature");
  const message = Array.from(params.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const digest = crypto
    .createHmac("sha256", appSecret)
    .update(message, "utf8")
    .digest("hex");

  const ok = signature === digest;

  // デバッグ情報を返す（okでもfalseでも）
  return {
    ok,
    reason: ok ? undefined : "invalid signature",
    debug: {
      constructedMessage: message,
      calculatedDigest: digest,
      signatureFromShopify: signature,
    },
  };
}
