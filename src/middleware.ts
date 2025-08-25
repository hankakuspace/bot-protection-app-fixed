// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import requestIp from "request-ip";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // ✅ IP を取得
  const ip =
    requestIp.getClientIp(req as any) ??
    req.headers.get("x-forwarded-for") ??
    "unknown";

  const res = NextResponse.next();
  res.headers.set("x-client-ip", ip); // ✅ ヘッダに渡す

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image).*)"],
};
