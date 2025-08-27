// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname; // 例: /api/shopify/proxy/admin/logs
  const searchParams = url.searchParams;

  // host チェック
  const host = searchParams.get("host");
  if (!host) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized: must access from Shopify Admin (host missing)" },
      { status: 401 }
    );
  }

  // ✅ /admin 配下は Proxy 経由の URL にリダイレクト
  if (pathname.includes("/admin")) {
    const proxyPath =
      "/apps/bpp-20250814-final01" + // ← Proxy サブパスを強制付与
      pathname.replace("/api/shopify/proxy", "") +
      (searchParams.toString() ? `?${searchParams.toString()}` : "");

    return NextResponse.redirect(proxyPath);
  }

  // それ以外は JSON 応答
  return NextResponse.json({
    ok: true,
    route: "proxy",
    path: pathname,
  });
}
