// src/app/api/verify-hmac/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyEmbeddedHmac } from "@/lib/verifyEmbeddedHmac";

export const runtime = "nodejs"; // ← Node.js ランタイムで crypto 使用OK

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const result = verifyEmbeddedHmac(url.searchParams, process.env.SHOPIFY_API_SECRET || "");

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
