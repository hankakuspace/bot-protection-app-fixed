// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname; // 例: /api/shopify/proxy/admin/logs
  const searchParams = url.searchParams;

  const host = searchParams.get("host");
  if (!host) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized: must access from Shopify Admin (host missing)" },
      { status: 401 }
    );
  }

  // ✅ /admin 配下は Next.js ページへ rewrite (絶対URLで指定)
  if (pathname.includes("/admin")) {
    const forwardPath = pathname.replace("/api/shopify/proxy", ""); // /admin/logs
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const absoluteUrl = `${req.nextUrl.origin}${forwardPath}${query}`;

    return NextResponse.rewrite(absoluteUrl);
  }

  // API用などはJSON応答
  return NextResponse.json({
    ok: true,
    route: "proxy",
    path: pathname,
  });
}
