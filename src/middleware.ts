// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import requestIp from "request-ip";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🚫 faviconリクエストは除外
  if (pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // 🚫 be-search.biz 以外のドメインは除外
  if (req.headers.get("host") !== "be-search.biz") {
    return NextResponse.next();
  }

  // 🚫 /admin 以下は除外
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.next();
  }

  // ✅ クライアントIPを取得
  const ip =
    requestIp.getClientIp(req as any) ??
    req.headers.get("x-forwarded-for") ??
    "unknown";

  // ✅ レスポンスにヘッダとして渡す
  const res = NextResponse.next();
  res.headers.set("x-client-ip", ip);

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image).*)"], // APIや静的ファイルは除外
};
