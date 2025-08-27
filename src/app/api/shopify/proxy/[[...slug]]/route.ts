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

  // ✅ /admin 配下は Next.js ページへ rewrite
  if (pathname.includes("/admin")) {
    const forwardPath = pathname.replace("/api/shopify/proxy", ""); // /admin/add-ip
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";

    // 絶対URLに変換
    const absoluteUrl = new URL(forwardPath + query, req.url);

    return NextResponse.rewrite(absoluteUrl);
  }

  return NextResponse.json({
    ok: true,
    route: "proxy",
    path: pathname,
  });
}
