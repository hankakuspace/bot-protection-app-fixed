// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIp } from "@/lib/ip-utils";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/favicon.ico" || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (
    process.env.NODE_ENV === "production" &&
    req.headers.get("host") !== "be-search.biz"
  ) {
    return NextResponse.next();
  }

  // ✅ クライアントIP取得
  const ip = await getClientIp(req);

  // ✅ API 経由で Firestore に問い合わせ
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bot-protection-ten.vercel.app";
    const res = await fetch(`${baseUrl}/api/admin/check-ip?ip=${ip}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.blocked) {
        console.warn(`[Middleware] Blocked IP detected: ${ip}`);
        return NextResponse.rewrite(new URL("/blocked", req.url));
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
