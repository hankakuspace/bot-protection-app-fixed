// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIp } from "@/lib/ip-utils";

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  // 🚫 除外: favicon, Next.js assets, API, 管理画面(/admin)
  if (
    pathname === "/favicon.ico" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/admin")
  ) {
    return NextResponse.next();
  }

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

// ✅ ストアフロントのみ対象
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|admin).*)"],
};
