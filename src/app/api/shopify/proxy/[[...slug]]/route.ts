// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname; 
  const searchParams = url.searchParams;

  const host = searchParams.get("host");
  if (!host) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized: must access from Shopify Admin (host missing)" },
      { status: 401 }
    );
  }

  // ✅ /admin/... は Vercel の UI ページにリダイレクト
  if (pathname.includes("/admin")) {
    const forwardPath = pathname.replace("/api/shopify/proxy", ""); // /admin/add-ip
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const vercelUrl = `https://bot-protection-ten.vercel.app${forwardPath}${query}`;
    return NextResponse.redirect(vercelUrl);
  }

  // それ以外は JSON
  return NextResponse.json({
    ok: true,
    route: "proxy",
    path: pathname,
  });
}
