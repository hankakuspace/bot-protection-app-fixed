import crypto from 'crypto';

/**
 * Shopify App Proxy の署名検証。
 * URLクエリから signature を除いた全キーを昇順に並べ、
 * "key=value&..." で連結した文字列に対して HMAC-SHA256(hex) を計算・比較します。
 */
export function verifyAppProxySignature(urlString: string, sharedSecret: string): boolean {
  if (!sharedSecret) return false;

  const url = new URL(urlString);
  const qs = url.searchParams;

  const providedSig = qs.get('signature') || '';
  if (!providedSig) return false;

  const entries = [...qs.entries()]
    .filter(([k]) => k !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b));

  const message = entries.map(([k, v]) => `${k}=${v}`).join('&');
  const computedHex = crypto.createHmac('sha256', sharedSecret).update(message).digest('hex');

  const a = Buffer.from(computedHex, 'hex');
  const b = Buffer.from(providedSig, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** デバッグ用：検証に使う canonical 文字列を生成 */
export function canonicalizeForSignature(urlString: string): string {
  const url = new URL(urlString);
  const entries = [...url.searchParams.entries()]
    .filter(([k]) => k !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([k, v]) => `${k}=${v}`).join('&');
}
