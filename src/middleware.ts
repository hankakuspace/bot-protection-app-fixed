// FILE: src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import requestIp from "request-ip";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) API や Next 静的配信は除外
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    const res = NextResponse.next();
    res.headers.set(
      "Content-Security-Policy",
      "frame-ancestors https://admin.shopify.com https://*.myshopify.com;"
    );
    return res;
  }

  // 2) /admin/* は Shopify 管理画面 iframe にそのまま埋め込みたいので IP チェックをスキップ
  if (pathname.startsWith("/admin")) {
    const res = NextResponse.next();
    res.headers.set(
      "Content-Security-Policy",
      "frame-ancestors https://admin.shopify.com https://*.myshopify.com;"
    );
    return res;
  }

  // 3) ここから通常ページの IP チェック
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
    // エラー時も通常どおり通す
  }

  // 4) 通常通す場合も CSP を付与
  const res = NextResponse.next();
  res.headers.set(
    "Content-Security-Policy",
    "frame-ancestors https://admin.shopify.com https://*.myshopify.com;"
  );
  return res;
}

// matcher を明確化
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
