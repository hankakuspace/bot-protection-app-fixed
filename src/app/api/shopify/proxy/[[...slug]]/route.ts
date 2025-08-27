// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname; // 例: /api/shopify/proxy/admin/add-ip
  const searchParams = url.searchParams;

  const host = searchParams.get("host");
  if (!host) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized: must access from Shopify Admin (host missing)" },
      { status: 401 }
    );
  }

  // ✅ /admin 配下は Next.js ページにそのまま rewrite
  if (pathname.includes("/admin")) {
    const forwardPath = pathname.replace("/api/shopify/proxy", ""); // → /admin/add-ip
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return NextResponse.rewrite(forwardPath + query);
  }

  return NextResponse.json({
    ok: true,
    route: "proxy",
    path: pathname,
  });
}
