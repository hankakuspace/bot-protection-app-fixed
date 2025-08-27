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

  // ✅ /admin 配下はリダイレクトせず、Next.js のページにそのままフォワード
  if (pathname.startsWith("/api/shopify/proxy/admin")) {
    const forwardPath = pathname.replace("/api/shopify/proxy", "");
    // Next.js の /admin/... ページを直接呼ぶ
    return NextResponse.rewrite(new URL(forwardPath + `?${searchParams.toString()}`, req.url));
  }

  // それ以外は JSON 応答
  return NextResponse.json({
    ok: true,
    route: "proxy",
    path: pathname,
  });
}
