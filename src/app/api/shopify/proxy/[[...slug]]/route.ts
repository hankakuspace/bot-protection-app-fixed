// FILE: src/app/api/shopify/proxy/[[...slug]]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * App Proxy 経由のアクセスは、まずは Shopify 管理画面の iframe に
 * UI を確実に表示させるため、無条件で /admin/logs へ内部リライト。
 * 表示確認後に署名検証やクエリ引き継ぎを段階的に戻す。
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// .env があれば優先、なければ Vercel の本番URLをデフォルト
const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://bot-protection-ten.vercel.app";
const TARGET_PATH = "/admin/logs";

export async function GET(_req: NextRequest) {
  return NextResponse.rewrite(new URL(TARGET_PATH, BASE));
}

export async function HEAD(_req: NextRequest) {
  return NextResponse.rewrite(new URL(TARGET_PATH, BASE));
}
