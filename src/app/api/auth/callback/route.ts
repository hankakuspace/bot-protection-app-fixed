// src/app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY!;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!;

function verifyHmac(params: URLSearchParams, secret: string) {
  const p = new URLSearchParams(params.toString());
  const hmac = p.get('hmac') || '';
  p.delete('hmac');
  const msg = decodeURIComponent(p.toString()).split('&').sort().join('&');
  const digest = crypto.createHmac('sha256', secret).update(msg).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac));
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const shop = sp.get('shop');
  const code = sp.get('code');
  const state = sp.get('state');
  const host = sp.get('host'); // 👈 追加: host パラメータ取得

  if (!shop || !code) {
    return NextResponse.json({ ok:false, error:'missing params' }, { status:400 });
  }
  if (!verifyHmac(sp, SHOPIFY_API_SECRET)) {
    return NextResponse.json({ ok:false, error:'invalid_hmac' }, { status:400 });
  }
  const cookieState = req.cookies.get('shopify_state')?.value;
  if (!cookieState || cookieState !== state) {
    return NextResponse.json({ ok:false, error:'invalid_state', state, cookieState }, { status:400 });
  }

  // アクセストークン交換
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'content-type':'application/json' },
    body: JSON.stringify({ client_id: SHOPIFY_API_KEY, client_secret: SHOPIFY_API_SECRET, code }),
  });
  if (!tokenRes.ok) {
    const t = await tokenRes.text();
    return NextResponse.json({ ok:false, error:'token_exchange_failed', detail:t }, { status:400 });
  }

  // ✅ 成功 ⇒ Shopify Admin のアプリTOPへリダイレクト
  if (host) {
    // Shopify Admin 内のアプリURLに戻す
    return NextResponse.redirect(
      `https://admin.shopify.com/store/ruhra-store/apps/bot-protection-proxy?host=${host}`,
      302
    );
  }

  // host が無いときだけ /installed にフォールバック
  return NextResponse.redirect(new URL('/installed', url.origin), 302);
}
