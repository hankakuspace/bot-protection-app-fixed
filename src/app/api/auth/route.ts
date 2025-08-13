// GET /api/auth?shop=<shop>.myshopify.com
import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY!;
const APP_URL = process.env.APP_URL!; // 例: https://bot-protection-ten.vercel.app
const SCOPES = process.env.SHOPIFY_SCOPES || ''; // 管理API使わないなら空でも可（必要なら read_content 等）

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get('shop');
  if (!shop || !shop.endsWith('.myshopify.com')) {
    return NextResponse.json({ error: 'missing shop' }, { status: 400 });
  }

  const redirectUri = `${APP_URL}/api/auth/callback`;
  const state = crypto.randomUUID();

  // 状態保存（必要ならCookie等に保存）: 簡易にSet-Cookie
  const authorizeUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  authorizeUrl.searchParams.set('client_id', SHOPIFY_API_KEY);
  authorizeUrl.searchParams.set('scope', SCOPES);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('state', state);

  const res = NextResponse.redirect(authorizeUrl.toString(), { status: 302 });
  res.headers.set('Set-Cookie', `shopify_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  return res;
}
