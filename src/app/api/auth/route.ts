// src/app/api/auth/route.ts
// GET /api/auth?shop=<shop>.myshopify.com[&dry=1]
import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_API_KEY = (process.env.SHOPIFY_API_KEY || '').trim();
const SCOPES = (process.env.SHOPIFY_SCOPES || '').trim();

function getOrigin(req: NextRequest) {
  const fromEnv = (process.env.SHOPIFY_APP_URL || process.env.APP_URL || '').trim();
  if (fromEnv) {
    try { const u = new URL(fromEnv); return `${u.protocol}//${u.host}`; } catch {}
  }
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop') || '';
  const dryRun = url.searchParams.get('dry') === '1';

  // 直観測ログ
  console.log('[AUTH/START]', {
    path: url.pathname, shop, qs: url.search, appUrlEnv: process.env.SHOPIFY_APP_URL || process.env.APP_URL
  });

  if (!SHOPIFY_API_KEY) return NextResponse.json({ error: 'missing SHOPIFY_API_KEY' }, { status: 500 });
  if (!shop.endsWith('.myshopify.com')) return NextResponse.json({ error: 'invalid shop', shop }, { status: 400 });

  const origin = getOrigin(req); // 例) https://bot-protection-ten.vercel.app
  const redirectUri = `${origin}/api/auth/callback`;
  const state = crypto.randomUUID();

  const authorize = new URL(`https://${shop}/admin/oauth/authorize`);
  authorize.searchParams.set('client_id', SHOPIFY_API_KEY);
  authorize.searchParams.set('scope', SCOPES);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('state', state);

  // ★ dry=1 ならリダイレクトせず JSON で中身を返す
  if (dryRun) {
    return NextResponse.json({
      ok: true,
      mode: 'dry-run',
      shop,
      origin,
      redirectUri,
      authorize: authorize.toString(),
      env: {
        SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || null,
        APP_URL: process.env.APP_URL || null,
      }
    });
  }

  const res = NextResponse.redirect(authorize.toString(), { status: 302 });
  res.headers.set(
    'Set-Cookie',
    ['shopify_state=' + state, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax', 'Max-Age=600'].join('; ')
  );
  return res;
}
