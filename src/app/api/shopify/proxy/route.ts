// src/app/api/shopify/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyProxySignature } from '@/lib/shopify';
import { checkIpAndLog } from '@/lib/check-ip';

export const runtime = 'nodejs'; // crypto使用のため

export async function GET(req: NextRequest) { return handleProxy(req); }
export async function POST(req: NextRequest) { return handleProxy(req); }

async function handleProxy(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sp = url.searchParams;

    // App Proxy が付与する代表的なクエリ
    const pathPrefix = sp.get('path_prefix') || '/apps';
    const extraPath = sp.get('extra_path') || 'check'; // テーマ側で ?extra_path=check を付与
    const shop = sp.get('shop') || '';
    const loggedInCustomerId = sp.get('logged_in_customer_id') || '';

    // 署名検証: "/apps/<subpath>/<action>" の形で検証
    const appsPath = `${pathPrefix}/bot-protection/${extraPath}`;
    const ok = verifyShopifyProxySignature({ path: appsPath, searchParams: sp });
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 });
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.ip ||
      '0.0.0.0';
    const userAgent = req.headers.get('user-agent') || '';

    // 既存ロジック呼び出し（国判定・ブラックリスト判定・ログ保存）
    const result = await checkIpAndLog({
      ip,
      userAgent,
      shop,                  // 監査用に渡すだけ（既存側で未使用なら無視されます）
      customerId: loggedInCustomerId,
    });

    return NextResponse.json({
      ok: true,
      blocked: result.blocked,
      allowedCountry: result.allowedCountry,
      country: result.country,
      isAdmin: result.isAdmin,
      reason: result.reason || null,
    }, {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    });
  } catch (e) {
    console.error('[proxy] error', e);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
