// src/app/api/auth/callback/route.ts
// GET /api/auth/callback?code=...&hmac=...&host=...&shop=...&state=...
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

const SHOPIFY_API_KEY = (process.env.SHOPIFY_API_KEY || '').trim();
const SHOPIFY_API_SECRET = (process.env.SHOPIFY_API_SECRET || '').trim();

/**
 * Shopify HMAC 検証
 * - hmac 以外の全クエリを key=value で & 連結
 * - URL エンコードはそのまま（decode しない）
 * - 比較は Buffer(hex) 同士で timingSafeEqual
 */
function verifyHmac(params: URLSearchParams, secret: string): boolean {
  const p = new URLSearchParams(params.toString());
  const hmac = (p.get('hmac') || '').trim();
  p.delete('hmac');

  // 文字列はエンコードされたままの key=value を & 連結、キーでソート
  const pairs: string[] = [];
  for (const [k, v] of p) pairs.push(`${k}=${v}`);
  pairs.sort();
  const msg = pairs.join('&');

  const digestHex = crypto.createHmac('sha256', secret).update(msg).digest('hex');

  // 長さが違うと timingSafeEqual が例外を投げるためガード
  const a = Buffer.from(digestHex, 'hex');
  const b = Buffer.from(hmac, 'hex');
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

function getBaseUrl(req: NextRequest) {
  // 環境変数にパス付きが入っていても origin のみに矯正（安全策）
  const fromEnv = (process.env.SHOPIFY_APP_URL || process.env.APP_URL || '').trim();
  if (fromEnv) {
    try {
      const u = new URL(fromEnv);
      return `${u.protocol}//${u.host}`;
    } catch {/* noop */}
  }
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  const shop = sp.get('shop');
  const code = sp.get('code');
  const state = sp.get('state');

  // 観測ログ
  console.log('[AUTH/CALLBACK]', { shop, hasCode: !!code, hasState: !!state });

  if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
    return NextResponse.json({ ok: false, error: 'missing api key/secret' }, { status: 500 });
  }
  if (!shop || !code || !shop.endsWith('.myshopify.com')) {
    return NextResponse.json({ ok: false, error: 'missing params' }, { status: 400 });
  }

  // 1) HMAC 検証
  if (!verifyHmac(sp, SHOPIFY_API_SECRET)) {
    return NextResponse.json({ ok: false, error: 'invalid_hmac' }, { status: 400 });
  }

  // 2) state 検証（/api/auth でセットした Cookie と比較）
  const cookieState = req.cookies.get('shopify_state')?.value;
  if (!cookieState || cookieState !== state) {
    return NextResponse.json({ ok: false, error: 'invalid_state' }, { status: 400 });
  }

  // 3) アクセストークン交換（オフライントークン）
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    console.error('[AUTH/TOKEN_ERROR]', tokenRes.status, text);
    return NextResponse.json(
      { ok: false, error: 'token_exchange_failed', status: tokenRes.status },
      { status: 500 }
    );
  }

  const { access_token, scope } = await tokenRes.json() as { access_token: string; scope: string };

  // TODO: DB に { shop, access_token, scope } を保存

  // 必要ならアプリ用セッション Cookie を設定
  const res = NextResponse.redirect(new URL('/installed', getBaseUrl(req)));
  res.cookies.set('shop', shop, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 60 * 60 * 24 * 30, // 30日
  });
  return res;
}
