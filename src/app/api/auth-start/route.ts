// src/app/api/auth-start/route.ts
// GET: 可視化（JSONを返すだけ）
// POST: 実際に Shopify の authorize へ 302 リダイレクト
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
  const u = new URL(`https://${shop}/admin/oauth/authorize`);
  u.searchParams.set('client_id', SHOPIFY_API_KEY);
  u.searchParams.set('scope', SCOPES);
  u.searchParams.set('redirect_uri', redirectUri);
  u.searchParams.set('state', state);
  return { authorize: u.toString(), redirectUri };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = (url.searchParams.get('shop') || '').trim();

  console.log('[AUTH-START/GET]', { path: url.pathname, qs: url.search, shop });

  if (!SHOPIFY_API_KEY) return NextResponse.json({ ok:false, error:'missing SHOPIFY_API_KEY' }, { status:500 });
  if (!shop.endsWith('.myshopify.com')) return NextResponse.json({ ok:false, error:'invalid shop', shop }, { status:400 });

  const origin = originOnly(req);
  const state = crypto.randomUUID();
  const { authorize, redirectUri } = buildAuthorizeURL(shop, origin, state);

  // 可視化（※リダイレクトしない）
  return NextResponse.json({
    ok: true, mode: 'visible',
    shop, origin, redirectUri, authorize,
    env: { SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || null, APP_URL: process.env.APP_URL || null }
  });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);

  // フォーム body からも受け取れるようにする（/hello から hidden 送信）
  let shop = (url.searchParams.get('shop') || '').trim();
  if (!shop) {
    try {
      const form = await req.formData();
      shop = (String(form.get('shop') || '')).trim();
    } catch {}
  }

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
