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

  const ip =
    requestIp.getClientIp(req as any) ??
    req.headers.get("x-forwarded-for") ??
    "unknown";

  const userAgent = req.headers.get("user-agent") ?? "unknown";
  const isAdmin = pathname.startsWith("/admin");

  try {
    // 🔽 アクセスログ保存 API を呼ぶ（fire-and-forget）
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/log-access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, userAgent, isAdmin }),
    }).catch((err) => console.error("log-access error:", err));
  } catch (err) {
    console.error("log-access error:", err);
  }

  // ✅ /admin/* は常に許可
  if (isAdmin) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image).*)"], // favicon.ico は除外済み
};
