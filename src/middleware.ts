// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import requestIp from "request-ip";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🚫 favicon
  if (pathname === "/favicon.ico") return NextResponse.next();

  // 🚫 API 完全除外
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // ✅ /admin パス → host パラメータが無くても通す（以前は403にしていた）
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.next();
  }

  // 🚫 host チェックは本番のみ
  if (
    process.env.NODE_ENV === "production" &&
    req.headers.get("host") !== "be-search.biz"
  ) {
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

  // CSPヘッダーを強制付与（Shopify管理画面iframe対応）
  res.headers.delete("Content-Security-Policy");
  res.headers.set(
    "Content-Security-Policy",
    "frame-ancestors https://admin.shopify.com https://*.myshopify.com"
  );

  res.headers.set("x-client-ip", ip);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
