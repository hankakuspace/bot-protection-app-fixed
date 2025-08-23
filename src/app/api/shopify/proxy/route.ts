// FILE: src/app/api/shopify/proxy/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Shopify App Proxy は API Route 内で rewrite が使えないため
 * /admin/logs に 302 redirect する。
 */
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/admin/logs", req.url), 302);
}

export async function HEAD(req: NextRequest) {
  return NextResponse.redirect(new URL("/admin/logs", req.url), 302);
}
