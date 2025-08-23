// FILE: src/app/api/shopify/oauth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const shop = url.searchParams.get("shop");
  const hmac = url.searchParams.get("hmac") || "";
  const code = url.searchParams.get("code");

  if (!shop || !hmac || !code) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  // HMAC 検証
  const params = [...url.searchParams.entries()]
    .filter(([key]) => key !== "hmac")
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join("&");

  const digest = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET || "")
    .update(params)
    .digest("hex");

  if (digest !== hmac) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 400 });
  }

  // TODO: アクセストークン取得処理
  return NextResponse.json({ ok: true, shop, code });
}
