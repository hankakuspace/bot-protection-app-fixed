// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIp } from "@/lib/ip-utils";

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  // favicon と API は除外
  if (pathname === "/favicon.ico") return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // ✅ クライアントIP取得
  const ip = await getClientIp(req);

  // ✅ APIでブロック確認
  try {
    const apiUrl = `${origin}/api/admin/check-ip?ip=${ip}`;
    const res = await fetch(apiUrl, { cache: "no-store" });

    if (res.ok) {
      const data = await res.json();
      if (data.blocked) {
        console.warn(`[Middleware] Blocked IP detected: ${ip}`);
        // ✅ 必ず絶対URLでリダイレクト
        return NextResponse.redirect(`${origin}/blocked`);
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
  matcher: ["/:path*"], // ✅ よりシンプルで確実
};
