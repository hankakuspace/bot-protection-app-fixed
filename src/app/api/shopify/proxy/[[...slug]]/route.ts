// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname; 
  const searchParams = url.searchParams;

  const host = searchParams.get("host");
  const shop = searchParams.get("shop");
  if (!host || !shop) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized: missing host/shop" },
      { status: 401 }
    );
  }

  // ✅ /admin 配下は myshopify.com 側の Proxy URL にリダイレクト
  if (pathname.includes("/admin")) {
    const forwardPath = pathname.replace("/api/shopify/proxy", "");
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";

    // 🔑 常に myshopify.com を使う（独自ドメインは埋め込み不可）
    const proxyUrl = `https://${shop}/apps/bpp-20250814-final01${forwardPath}${query}`;

    return NextResponse.redirect(proxyUrl);
  }

  return NextResponse.json({
    ok: true,
    route: "proxy",
    path: pathname,
  });
}
