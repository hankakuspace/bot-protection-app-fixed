// src/app/api/shopify/oauth/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // ❗ raw query を使う（decode された値を使わない）
  const rawQuery = url.search.slice(1);

  const params = Object.fromEntries(url.searchParams.entries());
  const shop = params["shop"];
  const code = params["code"];
  const hmac = params["hmac"];

  if (!shop || !code || !hmac) {
    return NextResponse.json({ ok: false, error: "Missing params" }, { status: 400 });
  }

  const secret = process.env.SHOPIFY_API_SECRET || "";

  // hmac を除外して canonical string を生成
  const queryObj = { ...params };
  delete queryObj["hmac"];

  const canonical = Object.keys(queryObj)
    .sort()
    .map((k) => `${k}=${queryObj[k]}`)
    .join("&");

  const digest = crypto.createHmac("sha256", secret).update(canonical).digest("hex");

  console.log("🧮 Raw query:", rawQuery);
  console.log("🧮 Canonical string:", canonical);
  console.log("🧮 Digest:", digest);
  console.log("📩 Provided hmac:", hmac);

  if (digest !== hmac.toLowerCase()) {
    return NextResponse.json(
      { ok: false, error: "Invalid HMAC", digest, provided: hmac, canonical },
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
