import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

// Shopifyの「API secret key（Shared secret）」を .env に設定しておく
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';

/** 署名検証（App Proxy）
 * - クエリから signature を除外
 * - キー昇順で "key=value" を & 連結した文字列
 * - HMAC-SHA256(secret) の hex を signature と timing-safe 比較
 */
function verifyProxySignature(req: NextRequest): boolean {
  if (!SHOPIFY_API_SECRET) return false;

  const url = new URL(req.url);
  const qs = url.searchParams;

  const signature = qs.get('signature') || '';
  if (!signature) return false;

  const entries = [...qs.entries()]
    .filter(([k]) => k !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b));

  const message = entries.map(([k, v]) => `${k}=${v}`).join('&');

  const digestHex = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(message)
    .digest('hex');

  const a = Buffer.from(digestHex, 'hex');
  const b = Buffer.from(signature, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function j(status: number, body: any) {
  return NextResponse.json(body, { status });
}

function unauthorized(detail: string) {
  return j(401, { ok: false, error: 'invalid signature', detail });
}

/** 到達確認のため、いまは /ping だけ署名不要で 200 を返す */
const ALLOW_UNSIGNED_PING = true;

export async function GET(req: NextRequest, ctx: { params: { slug?: string[] } }) {
  const path = '/' + (ctx.params?.slug ?? []).join('/');

  // 1) 健康チェック（到達確認）
  if (path === '/ping') {
    if (!ALLOW_UNSIGNED_PING) {
      if (!verifyProxySignature(req)) return unauthorized('ping requires valid signature');
    }
    const url = new URL(req.url);
    return j(200, {
      ok: true,
      ping: 'pong',
      via: 'app-proxy',
      unsigned: ALLOW_UNSIGNED_PING,
      echo: url.searchParams.get('echo') ?? null,
    });
  }

  // 2) それ以外は署名必須
  if (!verifyProxySignature(req)) return unauthorized('signature missing or invalid');

  // 3) ここから先は本処理（必要に応じて分岐を追加）
  const url = new URL(req.url);
  return j(200, {
    ok: true,
    path,
    shop: url.searchParams.get('shop') ?? '',
    path_prefix: url.searchParams.get('path_prefix') ?? '',
    echo: url.searchParams.get('echo') ?? null,
    note: 'signature verified, reached Vercel route',
  });
}

export async function POST(req: NextRequest, ctx: { params: { slug?: string[] } }) {
  const path = '/' + (ctx.params?.slug ?? []).join('/');

  if (path === '/ping') {
    if (!ALLOW_UNSIGNED_PING) {
      if (!verifyProxySignature(req)) return unauthorized('ping requires valid signature');
    }
    const body = await req.json().catch(() => ({}));
    return j(200, { ok: true, ping: 'pong', method: 'POST', body, unsigned: ALLOW_UNSIGNED_PING });
  }

  if (!verifyProxySignature(req)) return unauthorized('signature missing or invalid');

  const body = await req.json().catch(() => ({}));
  return j(200, { ok: true, path, method: 'POST', body, note: 'signature verified (POST)' });
}
