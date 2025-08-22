// src/app/api/shopify/proxy/route.ts
import type { NextRequest } from 'next/server';
import crypto from 'node:crypto';

// ---- App Router runtime hints（キャッシュ抑止）----
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ---- Env（任意）----
// Partners > 対象アプリ > App Proxy の「署名キー」を設定しておくと検証します。
// 未設定なら検証はスキップ（疎通確認用）。
const APP_PROXY_SECRET = process.env.SHOPIFY_APP_PROXY_SECRET || '';
const ENABLE_PROXY_HMAC = (process.env.ENABLE_PROXY_HMAC ?? 'true').toLowerCase() !== 'false';

// ---- Utilities ----
function log(kind: 'HEAD' | 'GET', req: NextRequest, extra: Record<string, unknown> = {}) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop') ?? 'UNKNOWN';
  // middleware からも見やすい短いログ
  console.log(`[app-proxy ${kind}]`, {
    t: new Date().toISOString(),
    shop,
    path: url.pathname,
    q: Object.fromEntries(url.searchParams.entries()),
    ...extra,
  });
}

function verifyAppProxyHmac(req: NextRequest, secret: string): boolean {
  if (!secret) return true; // シークレット未設定ならスキップ（疎通優先）
  if (!ENABLE_PROXY_HMAC) return true;

  const url = new URL(req.url);
  const sig = url.searchParams.get('signature');
  if (!sig) return false;

  const payload = [...url.searchParams.entries()]
    .filter(([k]) => k !== 'signature')
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('');

  const h = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(sig, 'hex'));
  } catch {
    return false;
  }
}

// ---- HEAD：Shopify が事前確認で投げることがある ----
export async function HEAD(req: NextRequest) {
  log('HEAD', req);
  return new Response(null, {
    status: 200,
    headers: {
      'cache-control': 'no-store',
      'x-app-proxy': 'head-ok',
    },
  });
}

// ---- GET：本体 ----
export async function GET(req: NextRequest) {
  const ok = verifyAppProxyHmac(req, APP_PROXY_SECRET);
  if (!ok) {
    log('GET', req, { auth: 'fail' });
    return new Response('Unauthorized', { status: 401 });
  }

  log('GET', req, { auth: APP_PROXY_SECRET ? 'ok' : 'skipped' });

  const { searchParams, pathname, origin } = new URL(req.url);
  const shop = searchParams.get('shop') ?? 'UNKNOWN';
  const echo = searchParams.get('echo');

  const body = `<!doctype html>
<html lang="ja"><meta charset="utf-8">
<title>App Proxy OK</title>
<body style="font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto">
  <h1>✅ App Proxy OK</h1>
  <p>Shop: <b>${shop}</b></p>
  <p>Path: ${pathname}</p>
  <p>Origin: ${origin}</p>
  <p>Time: ${new Date().toISOString()}</p>
  <details><summary>Query</summary><pre style="white-space:pre-wrap">${
    JSON.stringify(Object.fromEntries(searchParams.entries()), null, 2)
  }</pre></details>
  <p style="color:#666">HMAC: ${APP_PROXY_SECRET ? 'enabled' : 'disabled (env not set)'}</p>
  ${echo ? `<p style="color:#0a0">echo: ${echo}</p>` : ''}
</body></html>`;

  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      // 管理画面/店舗からの埋め込みを許可
      'content-security-policy': "frame-ancestors https://admin.shopify.com https://*.myshopify.com;",
    },
  });
}
