// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname; // e.g. /api/shopify/proxy/admin/add-ip
  const searchParams = url.searchParams;

  const host = searchParams.get("host");

  // ✅ hostが無くても /admin ページは通す
  if (pathname.includes("/admin")) {
    const forwardPath = pathname.replace("/api/shopify/proxy", ""); // /admin/add-ip
    return NextResponse.rewrite(`${req.nextUrl.origin}${forwardPath}`);
  }

  // ✅ API系は host必須チェック
  if (!host) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized: must access from Shopify Admin (host missing)" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    route: "proxy",
    path: pathname,
  });
}
