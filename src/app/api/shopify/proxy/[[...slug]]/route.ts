// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";

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

  // ✅ /admin/... は Next.js ページにそのまま処理させる → Proxy側では何もしない
  if (pathname.includes("/admin")) {
    return NextResponse.next();
  }

  // ✅ API用のパスだけ JSON を返す
  return NextResponse.json({
    ok: true,
    route: "proxy",
    path: pathname,
  });
}
