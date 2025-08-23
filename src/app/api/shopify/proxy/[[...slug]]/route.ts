// FILE: src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  console.log("App Proxy HIT (slug):", req.url);
  return NextResponse.redirect(new URL("/admin/logs", req.url), 302);
}

export async function HEAD(req: NextRequest) {
  return NextResponse.redirect(new URL("/admin/logs", req.url), 302);
}
