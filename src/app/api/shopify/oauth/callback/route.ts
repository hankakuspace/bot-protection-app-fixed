import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop")!;
    const code = searchParams.get("code")!;
    const hmac = searchParams.get("hmac")!;

    const secret = process.env.SHOPIFY_API_SECRET || "";
    const params = Object.fromEntries(searchParams.entries());

    // HMAC検証
    const { hmac: _, signature, ...rest } = params;
    const msg = Object.keys(rest)
      .sort()
      .map((k) => `${k}=${rest[k]}`)
      .join("&");

    const digest = crypto
      .createHmac("sha256", secret)
      .update(msg)
      .digest("hex");

    if (digest !== hmac) {
      return NextResponse.json({ ok: false, error: "Invalid HMAC" }, { status: 400 });
    }

    // アクセストークン取得
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    console.log("✅ Access token stored for shop:", shop);

    // 🔑 最後は Shopify 管理画面の App Proxy サブパスへリダイレクト
    const redirectUrl = `https://${shop}/admin/apps/bpp-20250814-final01`;

    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    console.error("OAuth callback error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
