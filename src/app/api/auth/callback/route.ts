// GET /api/auth/callback?code=...&hmac=...&host=...&shop=...&state=...
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY!;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!;
const APP_URL = process.env.APP_URL!;

function verifyHmac(params: URLSearchParams, secret: string) {
  // hmac検証: hmac以外をalpahbeticalに連結
  const p = new URLSearchParams(params.toString());
  const hmac = p.get('hmac') || '';
  p.delete('hmac');
  const msg = decodeURIComponent(p.toString())
    .split('&')
    .sort()
    .join('&');

  const digest = crypto.createHmac('sha256', secret).update(msg).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest, 'utf-8'), Buffer.from(hmac, 'utf-8'));
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  const shop = sp.get('shop');
  const code = sp.get('code');
  const state = sp.get('state');

  if (!shop || !code) {
    return NextResponse.json({ ok: false, error: 'missing params' }, { status: 400 });
  }

  // hmac検証
  if (!verifyHmac(sp, SHOPIFY_API_SECRET)) {
    return NextResponse.json({ ok: false, error: 'invalid_hmac' }, { status: 400 });
  }

  // state検証（簡易: Cookieから取り出して比較）
  const cookieState = req.cookies.get('shopify_state')?.value;
  if (!cookieState || cookieState !== state) {
    return NextResponse.json({ ok: false, error: 'invalid_state' }, { status: 400 });
  }

  // アクセストークン交換
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
    const t = await tokenRes.text();
    return NextResponse.json({ ok: false, error: 'token_exchange_failed', detail: t }, { status: 400 });
  }

  // トークンは保存しても良いが、今回はインストール確認だけの軽量実装
  // const { access_token, scope } = await tokenRes.json();

  // 完了画面（簡易）
  return new Response(
    `<html><body><h1>Installed 🎉</h1><p>App installed for ${shop}.</p></body></html>`,
    { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}
