// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import requestIp from "request-ip";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/log-access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-user-agent": userAgent, // ✅ 本当のUAをカスタムヘッダで送る
      },
      body: JSON.stringify({ ip, isAdmin }),
    }).catch((err) => console.error("log-access error:", err));
  } catch (err) {
    console.error("log-access error:", err);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image).*)"],
};
