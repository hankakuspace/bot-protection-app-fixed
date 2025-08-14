// src/lib/shopifyProxy.ts
import crypto from 'crypto';

export type PlainParams = Record<string, string | string[] | undefined>;

/** `URLSearchParams` → 純オブジェクト */
export function paramsToObject(search: URLSearchParams): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [k, v] of search.entries()) obj[k] = v;
  return obj;
}

/** 署名に使う canonical（signature を除外し、キー昇順で key=value&...） */
export function buildCanonicalQuery(allParams: PlainParams): string {
  const entries: [string, string][] = [];
  for (const key of Object.keys(allParams)) {
    if (key === 'signature') continue; // Shopify 仕様：signature は除外
    const raw = allParams[key];
    if (raw === undefined) continue;
    if (Array.isArray(raw)) {
      for (const v of raw) entries.push([key, v]);
    } else {
      entries.push([key, raw]);
    }
  }
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return entries.map(([k, v]) => `${k}=${v}`).join('&');
}

/** HMAC-SHA256 → 16進文字列 */
export function hmacHex(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

/** App Proxy 署名検証（true: OK） */
export function verifyAppProxySignature(
  queryParams: PlainParams,
  secret: string
): { ok: boolean; provided?: string; computed?: string; canonical?: string } {
  const provided = typeof queryParams['signature'] === 'string' ? (queryParams['signature'] as string) : undefined;
  if (!provided) return { ok: false };

  const canonical = buildCanonicalQuery(queryParams);
  const computed = hmacHex(canonical, secret);
  return { ok: timingSafeEqualHex(provided, computed), provided, computed, canonical };
}

/** 16進のタイミング安全比較 */
function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

/** クライアントIP推定（x-forwarded-for 先頭優先） */
export function extractClientIp(headers: Headers): { ip?: string; xff?: string; realIp?: string } {
  const xff = headers.get('x-forwarded-for') ?? '';
  const ip = xff.split(',')[0]?.trim() || undefined;
  const realIp = headers.get('x-real-ip') ?? undefined;
  return { ip, xff, realIp };
}
