// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Shopify App Proxy キャッチオール
 * - UI (/admin/...) はここで扱わない
 * - Proxy はテーマからの API リクエスト専用にする
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  const host = searchParams.get("host");
  if (!host) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized: must access from Shopify Admin (host missing)" },
      { status: 401 }
    );
  }

  // ✅ API 専用レスポンス
  return NextResponse.json({
    ok: true,
    route: "proxy",
    path: pathname,
  });
}
