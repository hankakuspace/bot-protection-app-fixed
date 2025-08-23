// FILE: src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import requestIp from "request-ip";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log("🔍 Middleware hit:", pathname);

  // ✅ API 全体は除外（App Proxy含む）
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ✅ /admin/* は常に許可
  if (pathname.startsWith("/admin")) {
    const res = NextResponse.next();
    res.headers.set(
      "Content-Security-Policy",
      "frame-ancestors https://admin.shopify.com https://*.myshopify.com;"
    );
    return res;
  }

  // 🔽 通常ページの IP チェック
  const ip =
    requestIp.getClientIp(req as any) ??
    req.headers.get("x-forwarded-for") ??
    "unknown";

  try {
    const resCheck = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/check-ip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip }),
    });
    const data = await resCheck.json();

    if (data.blocked) {
      const denied = new NextResponse("Access denied: your IP is blocked.", {
        status: 403,
      });
      denied.headers.set(
        "Content-Security-Policy",
        "frame-ancestors https://admin.shopify.com https://*.myshopify.com;"
      );
      return denied;
    }
  } catch (err) {
    console.error("Middleware error:", err);
  }

  const res = NextResponse.next();
  res.headers.set(
    "Content-Security-Policy",
    "frame-ancestors https://admin.shopify.com https://*.myshopify.com;"
  );
  return res;
}

// ✅ matcher を修正して /api は最初から除外
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
