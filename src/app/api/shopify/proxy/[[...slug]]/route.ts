// FILE: src/app/api/shopify/proxy/[[...slug]]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Shopify App Proxy 経由のアクセスを
 * 無条件で /admin/logs に内部リライトする。
 * （外部URLではなく req.url を基準に相対パスで指定するのがポイント）
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return NextResponse.rewrite(new URL("/admin/logs", req.url));
}

export async function HEAD(req: NextRequest) {
  return NextResponse.rewrite(new URL("/admin/logs", req.url));
}
