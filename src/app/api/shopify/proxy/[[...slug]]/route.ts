// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Shopify App Proxy キャッチオール
 * - Shopify 管理画面からのアクセスのみ許可
 * - /admin/... は UI ページへ転送
 * - それ以外は API/Fallback JSON
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  // ✅ Shopify が付与する host パラメータをチェック
  const host = searchParams.get("host");
  if (!host) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized: must access from Shopify Admin (host missing)",
      },
      { status: 401 }
    );
  }

  // ✅ /admin 配下は UI ページに転送
  if (pathname.includes("/admin")) {
    const forwardPath = pathname.replace("/api/shopify/proxy", "");
    // host / shop パラメータを維持したまま転送
    return NextResponse.redirect(
      new URL(forwardPath + `?${searchParams.toString()}`, req.url)
    );
  }

  // ✅ それ以外は JSON 応答
  return NextResponse.json({
    ok: true,
    route: "proxy",
    path: pathname,
  });
}
