// FILE: src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import requestIp from "request-ip";
import { db } from "@/lib/firebase";   // ← Firestore をインポート
import geoip from "geoip-lite";        // ← 国判定用

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log("🔍 Middleware hit:", pathname);

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

  const userAgent = req.headers.get("user-agent") || "UNKNOWN";

  // 国判定
  const geo = geoip.lookup(ip);
  const country = geo ? geo.country : "UNKNOWN";

  let blocked = false;
  let allowedCountry = true;
  let isAdmin = false;

  try {
    const resCheck = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/check-ip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip }),
    });
    const data = await resCheck.json();

    blocked = data.blocked ?? false;
    allowedCountry = data.allowedCountry ?? true;
    isAdmin = data.isAdmin ?? false;

    if (blocked) {
      const denied = new NextResponse("Access denied: your IP is blocked.", {
        status: 403,
      });
      denied.headers.set(
        "Content-Security-Policy",
        "frame-ancestors https://admin.shopify.com https://*.myshopify.com;"
      );

      // ❗ ブロックされたアクセスもログに残す
      await saveAccessLog(ip, country, allowedCountry, blocked, isAdmin, userAgent);

      return denied;
    }
  } catch (err) {
    console.error("Middleware error:", err);
  }

  // ✅ Firestore にアクセスログ保存
  await saveAccessLog(ip, country, allowedCountry, blocked, isAdmin, userAgent);

  const res = NextResponse.next();
  res.headers.set(
    "Content-Security-Policy",
    "frame-ancestors https://admin.shopify.com https://*.myshopify.com;"
  );
  return res;
}

// Firestore 保存関数
async function saveAccessLog(
  ip: string,
  country: string,
  allowedCountry: boolean,
  blocked: boolean,
  isAdmin: boolean,
  userAgent: string
) {
  try {
    await db.collection("access_logs").add({
      ip,
      country,
      allowedCountry,
      blocked,
      isAdmin,
      userAgent,
      timestamp: new Date().toISOString(),
    });
    console.log("✅ Access log saved:", ip, country, blocked);
  } catch (err) {
    console.error("❌ Failed to save access log:", err);
  }
}

// ✅ matcher で /api/* は最初から除外
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
