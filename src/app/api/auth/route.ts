// src/app/api/auth/route.ts
// GET /api/auth?shop=<shop>.myshopify.com
import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || '';
const SCOPES = process.env.SHOPIFY_SCOPES || ''; // 例: "read_products,read_themes"

function getBaseUrl(req: NextRequest) {
  // 優先: SHOPIFY_APP_URL -> APP_URL -> リクエストのオリジン
  const fromEnv =
    (process.env.SHOPIFY_APP_URL || process.env.APP_URL || '').trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`; // 例: https://bot-protection-ten.vercel.app
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop');

  if (!SHOPIFY_API_KEY) {
    return NextResponse.json({ error: 'missing SHOPIFY_API_KEY' }, { status: 500 });
  }
  if (!shop || !shop.endsWith('.myshopify.com')) {
    return NextResponse.json({ error: 'missing shop' }, { status: 400 });
  }

  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/callback`;
  const state = crypto.randomUUID();

  const authorizeUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  authorizeUrl.searchParams.set('client_id', SHOPIFY_API_KEY);
  authorizeUrl.searchParams.set('scope', SCOPES);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('state', state);
  // 任意: per-user トークンが欲しい場合
  // authorizeUrl.searchParams.append('grant_options[]', 'per-user');

  const res = NextResponse.redirect(authorizeUrl.toString(), { status: 302 });
  res.headers.set(
    'Set-Cookie',
    `shopify_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );
  return res;
}
