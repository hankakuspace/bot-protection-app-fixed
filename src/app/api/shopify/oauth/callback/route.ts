// src/app/api/shopify/oauth/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const rawQuery = url.search.slice(1); // 先頭の "?" を除いた部分
  const searchParams = new URLSearchParams(url.search);

  const shop = searchParams.get("shop");
  const code = searchParams.get("code");
  const providedHmac = searchParams.get("hmac") || "";

  if (!shop || !code || !providedHmac) {
    return NextResponse.json({ ok: false, error: "Missing params" }, { status: 400 });
  }

  const secret = process.env.SHOPIFY_API_SECRET || "";

  // rawQuery を直接 split → hmac を除外 → key=value をソート
  const canonical = rawQuery
    .split("&")
    .filter((p) => !p.startsWith("hmac="))
    .sort((a, b) => a.localeCompare(b))
    .join("&");

  const digest = crypto.createHmac("sha256", secret).update(canonical).digest("hex");

  console.log("📩 Raw query:", rawQuery);
  console.log("🧮 Canonical:", canonical);
  console.log("🧮 Digest:", digest);
  console.log("📩 Provided HMAC:", providedHmac);

  if (digest !== providedHmac.toLowerCase()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid HMAC",
        digest,
        provided: providedHmac,
        canonical,
      },
      { status: 400 }
    );
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
  console.log("✅ Access token response:", tokenData);

  const redirectUrl = `https://${shop}/admin/apps/bpp-20250814-final01`;
  return NextResponse.redirect(redirectUrl);
}
