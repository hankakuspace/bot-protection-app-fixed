// src/app/api/auth/route.ts
// GET /api/auth?shop=<shop>.myshopify.com[&hmac=...&host=...&timestamp=...]
import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_API_KEY = (process.env.SHOPIFY_API_KEY || '').trim();
const SCOPES = (process.env.SHOPIFY_SCOPES || '').trim();

function getBaseUrl(req: NextRequest) {
  const fromEnv = (process.env.SHOPIFY_APP_URL || process.env.APP_URL || '').trim();
  if (fromEnv) {
    try {
      const u = new URL(fromEnv);
      return `${u.protocol}//${u.host}`;
    } catch {}
  }
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop');
  const hmac = url.searchParams.get('hmac');
  const host = url.searchParams.get('host');

  // ループガード（5秒以内に同一パスへ再訪ならループ疑いでJSON返す）
  const loopGuard = req.cookies.get('oauth_loop_guard')?.value;
  if (loopGuard) {
    console.error('[AUTH/LOOP_DETECTED]', { shop, url: url.toString() });
    return NextResponse.json({ ok: false, error: 'loop_detected_at_auth', url: url.toString() }, { status: 508 });
  }

  console.log('[AUTH/START]', {
    shop,
    hasHmac: !!hmac,
    hasHost: !!host,
    env_APP_URL: process.env.APP_URL,
    env_SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL,
  });

  if (!SHOPIFY_API_KEY) {
    return NextResponse.json({ error: 'missing SHOPIFY_API_KEY' }, { status: 500 });
  }
  if (!shop || !shop.endsWith('.myshopify.com')) {
    return NextResponse.json({ error: 'missing shop' }, { status: 400 });
  }

  const baseUrl = getBaseUrl(req); // 例: https://bot-protection-ten.vercel.app
  const redirectUri = `${baseUrl}/api/auth/callback`;

  const state = crypto.randomUUID();
  const authorizeUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  authorizeUrl.searchParams.set('client_id', SHOPIFY_API_KEY);
  authorizeUrl.searchParams.set('scope', SCOPES);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('state', state);

  console.log('[AUTH/REDIRECTING]', {
    authorize: authorizeUrl.toString(),
    redirectUri,
  });

  const res = NextResponse.redirect(authorizeUrl.toString(), { status: 302 });
  res.headers.set(
    'Set-Cookie',
    [
      `shopify_state=${state}`,
      'Path=/',
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      'Max-Age=600',
    ].join('; ')
  );
  // 5秒だけループガードCookie
  res.cookies.set('oauth_loop_guard', '1', {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: true,
    maxAge: 5,
  });
  return res;
}
