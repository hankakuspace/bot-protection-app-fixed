// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIp } from "@/lib/ip-utils";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/favicon.ico") return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.next();

  if (
    process.env.NODE_ENV === "production" &&
    req.headers.get("host") !== "be-search.biz"
  ) {
    return NextResponse.next();
  }

  // ✅ クライアントIP取得
  const ip = await getClientIp(req);

  // ✅ API URL を req.nextUrl.origin ベースに変更
  const apiUrl = `${req.nextUrl.origin}/api/admin/check-ip?ip=${ip}`;

  try {
    const res = await fetch(apiUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (data.blocked) {
        console.warn(`[Middleware] Blocked IP detected: ${ip}`);
        return NextResponse.redirect(new URL("/blocked", req.url));
      }
    }
  } catch (err) {
    console.error("[Middleware] check-ip fetch failed", err);
  }

  const response = NextResponse.next();
  response.headers.set("x-client-ip", ip);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
