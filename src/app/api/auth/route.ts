// src/app/api/auth/route.ts
// GET /api/auth?shop=<shop>.myshopify.com
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
  const shop = url.searchParams.get('shop');

  if (!SHOPIFY_API_KEY) return NextResponse.json({ error: 'missing SHOPIFY_API_KEY' }, { status: 500 });
  if (!shop || !shop.endsWith('.myshopify.com')) return NextResponse.json({ error: 'missing shop' }, { status: 400 });

  const origin = getOrigin(req);
  const redirectUri = `${origin}/api/auth/callback`;
  const state = crypto.randomUUID();

  const authorizeUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  authorizeUrl.searchParams.set('client_id', SHOPIFY_API_KEY);
  authorizeUrl.searchParams.set('scope', SCOPES);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('state', state);

  const res = NextResponse.redirect(authorizeUrl.toString(), { status: 302 });
  res.headers.set(
    'Set-Cookie',
    ['shopify_state=' + state, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax', 'Max-Age=600'].join('; ')
  );
  return res;
}
