import { NextResponse } from 'next/server';
import { verifyAppProxySignature } from '@/lib/shopifyProxy';
import crypto from 'crypto';

export const runtime = 'nodejs';

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';
const ENABLE_PROXY_DEBUG = process.env.DEBUG_PROXY === '1';

function j(status: number, body: any) {
  return NextResponse.json(body, { status });
}
function unauthorized(detail: string) {
  return j(401, { ok: false, error: 'invalid signature', detail });
}
function assertSigned(req: Request): boolean {
  return verifyAppProxySignature(req.url, SHOPIFY_API_SECRET);
}

export async function GET(req: Request, context: any) {
  const slug: string[] = context?.params?.slug ?? [];
  const path = '/' + slug.join('/');
  const url = new URL(req.url);

  // === 強化版 /debug-params（署名バイパスは DEBUG_PROXY=1 の時だけ） ===
  if (path === '/debug-params' && ENABLE_PROXY_DEBUG) {
    const q: Record<string, string> = {};
    url.searchParams.forEach((v, k) => (q[k] = v));

    const entries = [...url.searchParams.entries()]
      .filter(([k]) => k !== 'signature')
      .sort(([a], [b]) => a.localeCompare(b));
    const canonical = entries.map(([k, v]) => `${k}=${v}`).join('&');

    // サーバ側シークレットでの「計算結果」と突き合わせ
    const provided = url.searchParams.get('signature') || '';
    const computed = SHOPIFY_API_SECRET
      ? crypto.createHmac('sha256', SHOPIFY_API_SECRET).update(canonical).digest('hex')
      : '(no-secret)';

    const maskedSecret = SHOPIFY_API_SECRET
      ? `${SHOPIFY_API_SECRET.slice(0, 4)}…${SHOPIFY_API_SECRET.slice(-4)}`
      : '(empty)';

    return j(200, {
      ok: true,
      path,
      query: q,
      hasSignature: 'signature' in q,
      canonicalUsedForSigning: canonical,
      providedSignature: provided,
      computedSignature: computed,
      match: provided && computed !== '(no-secret)' ? provided === computed : false,
      env: { SHOPIFY_API_SECRET: maskedSecret },
      note: 'DEBUG ONLY: 調査後は DEBUG_PROXY を OFF にしてください'
    });
  }

  // 以降、通常フロー（署名必須）
  if (!assertSigned(req)) return unauthorized('signature missing or invalid');

  if (path === '/ping') {
    return j(200, { ok: true, ping: 'pong', via: 'app-proxy' });
  }

  if (path === '/echo') {
    const q: Record<string, string> = {};
    url.searchParams.forEach((v, k) => (q[k] = v));
    return j(200, { ok: true, path, query: q });
  }

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

  return j(200, { ok: true, path, note: 'signature verified, reached Vercel route' });
}

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
