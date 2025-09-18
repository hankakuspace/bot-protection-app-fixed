// src/lib/verifyAppProxy.ts
import crypto from "crypto";

export function verifyAppProxySignature(
  url: URL,
  appSecret: string,
  opts: { checkTimestamp?: boolean; maxAgeSeconds?: number } = {}
) {
  const { checkTimestamp = false, maxAgeSeconds = 300 } = opts;

  const params = new URLSearchParams(url.search);
  const signature = params.get("signature");
  if (!signature) return { ok: false, reason: "missing signature" };

  if (checkTimestamp) {
    const ts = parseInt(params.get("timestamp") || "0", 10);
    const now = Math.floor(Date.now() / 1000);
    if (!ts || Math.abs(now - ts) > maxAgeSeconds) {
      return { ok: false, reason: "timestamp expired", debug: { ts, now } };
    }
  }

  params.delete("signature");

  // ✅ 空文字も含めてすべてのパラメータを対象にする
  const entries = Array.from(params.entries());

  const canonical = entries
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${k}=${v}`) // 空でもそのまま含める
    .join(""); // Shopifyは区切りなし連結

  const digest = crypto
    .createHmac("sha256", appSecret)
    .update(canonical, "utf8")
    .digest("hex");

  let ok = false;
  try {
    ok =
      signature.length > 0 &&
      crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(digest, "hex")
      );
  } catch {
    ok = false;
  }

  return {
    ok,
    reason: ok ? undefined : "invalid signature",
    debug: { canonical, digest, signatureFromShopify: signature },
  };
}
