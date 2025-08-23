// FILE: src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  console.log("App Proxy HIT (slug):", req.url);

  // 🔑 /admin/logs に正しくリダイレクト（サイトルート基準）
  return NextResponse.redirect("/admin/logs", 302);
}

export async function HEAD(req: NextRequest) {
  return NextResponse.redirect("/admin/logs", 302);
}
