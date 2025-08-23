// FILE: src/app/api/shopify/proxy/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  console.log("Proxy HIT (no-slug)", req.url);
  return NextResponse.rewrite(new URL("/admin/logs", req.url));
}

export async function HEAD(req: NextRequest) {
  return NextResponse.rewrite(new URL("/admin/logs", req.url));
}
