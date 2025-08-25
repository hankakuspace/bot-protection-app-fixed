// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import requestIp from "request-ip";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const res = NextResponse.next();
    res.headers.set(
      "Content-Security-Policy",
      "frame-ancestors https://admin.shopify.com https://*.myshopify.com;"
    );
    return res;
  }

  const ip =
    requestIp.getClientIp(req as any) ??
    req.headers.get("x-forwarded-for") ??
    "unknown";

  const userAgent = req.headers.get("user-agent") || "UNKNOWN";

  // 👉 Firestore保存はAPIに任せる
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/log-access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, userAgent }),
    });
  } catch (err) {
    console.error("Error sending log to API:", err);
  }

  const res = NextResponse.next();
  res.headers.set(
    "Content-Security-Policy",
    "frame-ancestors https://admin.shopify.com https://*.myshopify.com;"
  );
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
