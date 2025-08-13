// GET /api/auth-start?shop=<shop>.myshopify.com[&dry=1]
// POST /api/auth-start で OAuth 開始（リダイレクト実施）
import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_API_KEY = (process.env.SHOPIFY_API_KEY || '').trim();
const SCOPES = (process.env.SHOPIFY_SCOPES || '').trim();

function originOnly(req: NextRequest) {
  const fromEnv = (process.env.SHOPIFY_APP_URL || process.env.APP_URL || '').trim();
  if (fromEnv) {
    try { const u = new URL(fromEnv); return `${u.protocol}//${u.host}`; } catch {}
  }
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

function buildAuthorizeURL(shop: string, origin: string, state: string) {
  const redirectUri = `${origin}/api/auth/callback`;
  const authorize = new URL(`https://${shop}/admin/oauth/authorize`);
  authorize.searchParams.set('client_id', SHOPIFY_API_KEY);
  authorize.searchParams.set('scope', SCOPES);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('state', state);
  return { authorize: authorize.toString(), redirectUri };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = (url.searchParams.get('shop') || '').trim();

  console.log('[AUTH-START/GET]', { path: url.pathname, qs: url.search, shop,
    env_APP_URL: process.env.APP_URL, env_SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL });

  if (!SHOPIFY_API_KEY) return NextResponse.json({ ok:false, error:'missing SHOPIFY_API_KEY' }, { status:500 });
  if (!shop.endsWith('.myshopify.com')) return NextResponse.json({ ok:false, error:'invalid shop', shop }, { status:400 });

  const origin = originOnly(req);
  const state = crypto.randomUUID();
  const { authorize, redirectUri } = buildAuthorizeURL(shop, origin, state);

  // ★ ここでは絶対にリダイレクトしない（dry-run出力）
  return NextResponse.json({
    ok: true,
    mode: 'visible',
    note: 'POST /api/auth-start で OAuth を開始します（このGETはリダイレクトしません）',
    shop, origin, redirectUri, authorize,
    env: { SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || null, APP_URL: process.env.APP_URL || null }
  });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const shop = (url.searchParams.get('shop') || '').trim();
  if (!SHOPIFY_API_KEY) return NextResponse.json({ ok:false, error:'missing SHOPIFY_API_KEY' }, { status:500 });
  if (!shop.endsWith('.myshopify.com')) return NextResponse.json({ ok:false, error:'invalid shop', shop }, { status:400 });

  const origin = originOnly(req);
  const state = crypto.randomUUID();
  const { authorize } = buildAuthorizeURL(shop, origin, state);

  console.log('[AUTH-START/POST -> REDIRECT]', { shop, to: authorize });

  const res = NextResponse.redirect(authorize, { status: 302 });
  res.headers.set('Set-Cookie', [
    `shopify_state=${state}`, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax', 'Max-Age=600',
  ].join('; '));
  return res;
}
