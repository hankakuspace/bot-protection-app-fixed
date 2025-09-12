// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIp } from "@/lib/ip-utils";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🚫 favicon は除外
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

  // ✅ API 経由でブロック判定
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://bot-protection-ten.vercel.app";

    const res = await fetch(`${baseUrl}/api/admin/check-ip?ip=${ip}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store", // 🔑 キャッシュ無効化
    });

    if (res.ok) {
      const data = await res.json();
      if (data.blocked) {
        console.warn(`[Middleware] Blocked IP detected: ${ip}`);
        return NextResponse.redirect(new URL("/blocked", req.url)); // ✅ redirect に変更
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
