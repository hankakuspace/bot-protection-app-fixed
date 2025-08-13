import crypto from "crypto";

export function verifyAppProxySignature(
  url: URL,
  appSecret: string
): { ok: boolean; reason?: string; debug?: any } {
  const search = url.search.startsWith("?") ? url.search.slice(1) : url.search;

  // URLSearchParams でパース（自動デコードされる）
  const map = new Map<string, string[]>();
  for (const [k, v] of new URLSearchParams(search).entries()) {
    if (k === "signature") continue;
    const arr = map.get(k);
    if (arr) arr.push(v);
    else map.set(k, [v]);
  }

  // 値が複数あるキーは "," で連結 → "key=value1,value2"
  const parts = Array.from(map.entries()).map(([k, vs]) => `${k}=${vs.join(",")}`);

  // キー昇順でソートして、区切り文字なしで連結（重要！）
  const message = parts.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).join("");

  const signature = new URLSearchParams(search).get("signature") || "";
  const digest = crypto.createHmac("sha256", appSecret).update(message, "utf8").digest("hex");

  const ok = signature.length > 0 && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));

  return {
    ok,
    reason: ok ? undefined : "invalid signature",
    debug: { constructedMessage: message, calculatedDigest: digest, signatureFromShopify: signature },
  };
}
