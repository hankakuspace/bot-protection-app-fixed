// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIp, isIpBlocked } from "@/lib/check-ip";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🚫 favicon
  if (pathname === "/favicon.ico") return NextResponse.next();

  // 🚫 API 完全除外（OAuth含む）
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // 🚫 host チェックは本番のみ
  if (
    process.env.NODE_ENV === "production" &&
    req.headers.get("host") !== "be-search.biz"
  ) {
    return NextResponse.next();
  }

  // ✅ クライアントIP取得
  const ip = await getClientIp(req);

  // ✅ Firestore でブロック判定
  const blocked = await isIpBlocked(ip);
  if (blocked) {
    console.warn(`[Middleware] Blocked IP detected: ${ip}`);
    return NextResponse.rewrite(new URL("/blocked", req.url)); // 🚫 ブロックページへリダイレクト
  }

  const res = NextResponse.next();
  res.headers.set("x-client-ip", ip);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
