import { NextResponse } from 'next/server';
import { verifyAppProxySignature } from '@/lib/shopifyProxy';

export const runtime = 'nodejs';

// ── 環境変数 ────────────────────────────────────────────
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';
// フラグONの時だけ /debug-params を署名バイパスで有効化
const ENABLE_PROXY_DEBUG = process.env.DEBUG_PROXY === '1';

// ── ヘルパ ──────────────────────────────────────────────
function j(status: number, body: any) {
  return NextResponse.json(body, { status });
}
function unauthorized(detail: string) {
  return j(401, { ok: false, error: 'invalid signature', detail });
}

// ── 署名OKチェック（通常は常に必須） ─────────────────────
function assertSigned(req: Request): boolean {
  return verifyAppProxySignature(req.url, SHOPIFY_API_SECRET);
}

// ── GET ─────────────────────────────────────────────────
export async function GET(req: Request, context: any) {
  const slug: string[] = context?.params?.slug ?? [];
  const path = '/' + slug.join('/');
  const url = new URL(req.url);

  // ★ デバッグ専用（署名バイパス）: /debug-params
  //    DEBUG_PROXY=1 のときのみ有効化。Shopifyが本当に付けてくるqueryを可視化します。
  if (ENABLE_PROXY_DEBUG && path === '/debug-params') {
    const q: Record<string, string> = {};
    url.searchParams.forEach((v, k) => (q[k] = v));

    const entries = [...url.searchParams.entries()]
      .filter(([k]) => k !== 'signature')
      .sort(([a], [b]) => a.localeCompare(b));
    const canonical = entries.map(([k, v]) => `${k}=${v}`).join('&');

    return j(200, {
      ok: true,
      path,
      query: q,
      hasSignature: Object.prototype.hasOwnProperty.call(q, 'signature'),
      canonicalUsedForSigning: canonical,
      note:
        'DEBUG ONLY: このエンドポイントは DEBUG_PROXY=1 でのみ有効。調査が終わったら必ず環境変数をOFFにしてください。',
    });
  }

  // 通常フロー（署名必須）
  if (!assertSigned(req)) return unauthorized('signature missing or invalid');

  // /ping
  if (path === '/ping') {
    return j(200, { ok: true, ping: 'pong', via: 'app-proxy' });
  }

  // /echo
  if (path === '/echo') {
    const q: Record<string, string> = {};
    url.searchParams.forEach((v, k) => (q[k] = v));
    return j(200, { ok: true, path, query: q });
  }

  // /ip-check（軽量版：IP/ヘッダの確認だけ返す）
  if (path === '/ip-check') {
    const xf = req.headers.get('x-forwarded-for') ?? null;
    const ip =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      (xf ? xf.split(',')[0].trim() : null);

    return j(200, {
      ok: true,
      path,
      ip,
      forwardedFor: xf,
      headers: {
        'cf-connecting-ip': req.headers.get('cf-connecting-ip') ?? null,
        'x-real-ip': req.headers.get('x-real-ip') ?? null,
      },
    });
  }

  // 既定
  return j(200, { ok: true, path, note: 'signature verified, reached Vercel route' });
}

// ── POST ────────────────────────────────────────────────
export async function POST(req: Request, context: any) {
  const slug: string[] = context?.params?.slug ?? [];
  const path = '/' + slug.join('/');

  if (!assertSigned(req)) return unauthorized('signature missing or invalid');

  if (path === '/ping') {
    const body = await req.json().catch(() => ({}));
    return j(200, { ok: true, ping: 'pong', method: 'POST', body });
  }

  if (path === '/echo') {
    const body = await req.json().catch(() => ({}));
    return j(200, { ok: true, echo: body, method: 'POST' });
  }

  return j(200, { ok: true, path, method: 'POST' });
}
