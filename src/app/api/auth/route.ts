// src/app/api/auth/route.ts
// GET /api/auth?shop=<shop>.myshopify.com[&hmac=...&host=...&timestamp=...]
import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_API_KEY = (process.env.SHOPIFY_API_KEY || '').trim();
const SCOPES = (process.env.SHOPIFY_SCOPES || '').trim(); // 例: "read_products,read_themes"

/**
 * ベースURL決定：
 * - 環境変数（SHOPIFY_APP_URL or APP_URL）に値があれば “オリジンのみ” を使用
 *   ※ 誤ってパス付き（…/auth 等）が入っていても origin に矯正
 * - それ以外はリクエストのオリジン
 */
function getBaseUrl(req: NextRequest) {
  const fromEnv = (process.env.SHOPIFY_APP_URL || process.env.APP_URL || '').trim();
  if (fromEnv) {
    try {
      const u = new URL(fromEnv);
      return `${u.protocol}//${u.host}`;
    } catch {
      // 無効ならフォールバック
    }
  }
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const shop = url.searchParams.get('shop');
  const hmac = url.searchParams.get('hmac');
  const host = url.searchParams.get('host');

  // 観測ログ（Vercel Logs 用）
  console.log('[AUTH/START]', {
    shop,
    hmac: Boolean(hmac),
    host: Boolean(host),
    ua: req.headers.get('user-agent'),
  });

  if (!SHOPIFY_API_KEY) {
    return NextResponse.json({ error: 'missing SHOPIFY_API_KEY' }, { status: 500 });
  }
  if (!shop || !shop.endsWith('.myshopify.com')) {
    return NextResponse.json({ error: 'missing shop' }, { status: 400 });
  }

  const baseUrl = getBaseUrl(req); // 例: https://bot-protection-ten.vercel.app
  const redirectUri = `${baseUrl}/api/auth/callback`; // ← パスが二重化しない

  const state = crypto.randomUUID();
  const authorizeUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  authorizeUrl.searchParams.set('client_id', SHOPIFY_API_KEY);
  authorizeUrl.searchParams.set('scope', SCOPES);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('state', state);
  // authorizeUrl.searchParams.append('grant_options[]', 'per-user'); // 任意

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
  return res;
}
