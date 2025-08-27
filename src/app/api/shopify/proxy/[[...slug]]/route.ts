// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname; // e.g. /api/shopify/proxy/admin/add-ip
  const searchParams = url.searchParams;

  const host = searchParams.get("host");
  if (!host) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized: must access from Shopify Admin (host missing)" },
      { status: 401 }
    );
  }

  // ✅ /admin 配下は Proxy 経由の URL にリダイレクト（絶対URL）
  if (pathname.includes("/admin")) {
    const forwardPath = pathname.replace("/api/shopify/proxy", "");
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";

    // host パラメータは base64 でエンコードされた admin URL を含む
    // Shopify embedded app の場合、必ずストアドメインに戻す
    const shop = searchParams.get("shop");
    const proxyUrl = `https://${shop}/apps/bpp-20250814-final01${forwardPath}${query}`;

    return NextResponse.redirect(proxyUrl);
  }

  return NextResponse.json({
    ok: true,
    route: "proxy",
    path: pathname,
  });
}
