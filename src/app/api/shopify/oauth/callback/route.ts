// src/app/api/shopify/oauth/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const search = url.search.slice(1); // hmac=...&shop=... の部分
  const providedHmac = url.searchParams.get("hmac") || "";
  const shop = url.searchParams.get("shop");
  const code = url.searchParams.get("code");

  if (!shop || !code || !providedHmac) {
    return NextResponse.json({ ok: false, error: "Missing params" }, { status: 400 });
  }

  const secret = process.env.SHOPIFY_API_SECRET || "";

  // ❗ hmac パラメータだけを取り除いた raw query を使う
  const message = search
    .split("&")
    .filter((p) => !p.startsWith("hmac="))
    .join("&");

  const digest = crypto.createHmac("sha256", secret).update(message).digest("hex");

  console.log("🧮 Raw message:", message);
  console.log("🧮 Digest:", digest);
  console.log("📩 Provided hmac:", providedHmac);

  if (digest !== providedHmac.toLowerCase()) {
    return NextResponse.json(
      { ok: false, error: "Invalid HMAC", digest, provided: providedHmac, message },
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
