// src/lib/shopify.ts
import crypto from 'crypto';

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';

/**
 * App Proxy の署名検証
 *  - path: "/apps/..." (App Proxy 側の実パス)
 *  - searchParams: signature を含む全クエリ（ただし計算時は signature 除外）
 */
export function verifyShopifyProxySignature({
  path,
  searchParams,
}: {
  path: string;
  searchParams: URLSearchParams;
}): boolean {
  if (!SHOPIFY_API_SECRET) return false;

  const providedSignature = searchParams.get('signature') || '';
  if (!providedSignature) return false;

  // signature を除外してキー昇順で連結
  const kvPairs: string[] = [];
  const sortedKeys = Array.from(searchParams.keys())
    .filter((k) => k !== 'signature')
    .sort();

  for (const key of sortedKeys) {
    const value = searchParams.getAll(key).join(',');
    kvPairs.push(`${key}=${value}`);
  }

  const raw = `${path}?${kvPairs.join('&')}`;

  const hmac = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(raw, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(providedSignature));
}
