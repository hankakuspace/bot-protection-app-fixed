// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import requestIp from "request-ip";

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // 🚫 favicon
  if (pathname === "/favicon.ico") return NextResponse.next();

  // 🚫 API 完全除外
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // 🚫 /admin パスは host パラメータ必須（Shopify経由のみ許可）
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const hostParam = searchParams.get("host");
    if (!hostParam) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: must access from Shopify Admin (host missing)" },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // 🚫 host チェックは本番のみ
  if (process.env.NODE_ENV === "production" && req.headers.get("host") !== "be-search.biz") {
    return NextResponse.next();
  }

  // ✅ IP取得
  let ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    requestIp.getClientIp(req as any) ||
    "UNKNOWN";

  ip = ip.replace(/^::ffff:/, "");

  const res = NextResponse.next();
  res.headers.set("x-client-ip", ip);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
