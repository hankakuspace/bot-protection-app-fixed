// FILE: src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  console.log("App Proxy HIT:", req.url);

  // ✅ シンプルに React UI へリダイレクト
  return NextResponse.redirect("/admin/logs");
}

export async function POST(req: NextRequest) {
  console.log("App Proxy POST HIT:", req.url);

  return NextResponse.json({ ok: true, message: "Proxy POST OK" });
}
