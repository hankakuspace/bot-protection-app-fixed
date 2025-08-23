// FILE: src/app/api/shopify/oauth/start/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop) {
    return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
  }

  const redirectUri = `${process.env.SHOPIFY_APP_URL}/api/shopify/oauth/callback`;
  const scopes = process.env.SHOPIFY_SCOPES || "read_products";

  const installUrl =
    `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}` +
    `&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(installUrl);
}
