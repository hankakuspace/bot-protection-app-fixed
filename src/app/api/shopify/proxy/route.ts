// FILE: src/app/api/shopify/proxy/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Shopify Proxy から渡ってくるクエリをログ出力
  console.log("🔍 Proxy HIT:", req.url);
  console.log("🔍 Query Params:", req.nextUrl.searchParams.toString());

  // まずは admin/logs にリダイレクト
  return NextResponse.redirect(new URL("/admin/logs", req.url), 302);
}

export async function HEAD(req: NextRequest) {
  console.log("🔍 Proxy HEAD:", req.url);
  return NextResponse.redirect(new URL("/admin/logs", req.url), 302);
}
