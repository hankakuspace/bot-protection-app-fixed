// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Shopify App Proxy キャッチオール
 * - /apps/... に来たリクエストを受けて UI ページ or API に振り分け
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  // 例: /api/shopify/proxy/admin/logs

  // ✅ /admin 配下は UI ページに転送
  if (pathname.includes("/admin")) {
    const forwardPath = pathname.replace("/api/shopify/proxy", "");
    return NextResponse.redirect(new URL(forwardPath, req.url));
  }

  // ✅ それ以外は JSON 応答
  return NextResponse.json({
    ok: true,
    route: "proxy",
    path: pathname,
  });
}
