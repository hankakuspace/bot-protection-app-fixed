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

  // ✅ /admin 配下は rewrite/redirect せず「OKレスポンス」を返す
  // → Next.js が /admin/... ページをそのまま処理できるようにする
  if (pathname.includes("/admin")) {
    return NextResponse.json({
      ok: true,
      route: "admin-ui",
      path: pathname,
      query: Object.fromEntries(searchParams.entries()),
    });
  }

  // ✅ APIなど他リクエスト用
  return NextResponse.json({
    ok: true,
    route: "proxy",
    path: pathname,
  });
}
