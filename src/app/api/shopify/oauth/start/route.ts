import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const shop = req.nextUrl.searchParams.get("shop");
    if (!shop) {
      console.error("❌ Missing shop parameter");
      return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
    }

    console.log("🟢 OAuth start hit", {
      shop,
      SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
      SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL,
      SHOPIFY_SCOPES: process.env.SHOPIFY_SCOPES,
    });

    const redirectUri = `${process.env.SHOPIFY_APP_URL}/api/shopify/oauth/callback`;
    const scopes = process.env.SHOPIFY_SCOPES || "read_products";

    const installUrl =
      `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}` +
      `&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    console.log("➡️ Redirecting to:", installUrl);

    return NextResponse.redirect(installUrl);
  } catch (err) {
    console.error("❌ OAuth start error:", err);
    return NextResponse.json({ error: "OAuth start failed", detail: String(err) }, { status: 500 });
  }
}
