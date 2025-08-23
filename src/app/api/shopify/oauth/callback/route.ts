// src/app/api/shopify/oauth/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const rawQuery = url.search.slice(1);

    const queryParams = rawQuery.split("&");
    const providedHmac = queryParams.find((p) => p.startsWith("hmac="))?.split("=")[1] || "";
    const shop = queryParams.find((p) => p.startsWith("shop="))?.split("=")[1] || "";
    const code = queryParams.find((p) => p.startsWith("code="))?.split("=")[1] || "";

    const secret = process.env.SHOPIFY_API_SECRET || "";

    // 🚩 必ず最初にログ出力
    console.error(
      "🚩 CALLBACK HIT",
      JSON.stringify({
        rawQuery,
        shop,
        code,
        providedHmac,
        secretLength: secret.length,
        secretPreview: secret.substring(0, 6) + "...",
      })
    );

    if (!shop || !code || !providedHmac) {
      return NextResponse.json({ ok: false, error: "Missing params" }, { status: 400 });
    }

    // canonical string を構築
    const canonical = queryParams
      .filter((p) => !p.startsWith("hmac="))
      .map((p) => {
        const [k, v] = p.split("=");
        return { k, v };
      })
      .sort((a, b) => a.k.localeCompare(b.k))
      .map((entry) => `${entry.k}=${entry.v}`)
      .join("&");

    const digest = crypto.createHmac("sha256", secret).update(canonical).digest("hex");

    console.error(
      "🧮 HMAC CHECK",
      JSON.stringify({
        canonical,
        digest,
        providedHmac,
        match: digest === providedHmac.toLowerCase(),
      })
    );

    if (digest !== providedHmac.toLowerCase()) {
      return NextResponse.json(
        { ok: false, error: "Invalid HMAC", digest, provided: providedHmac, canonical },
        { status: 400 }
      );
    }

    return NextResponse.redirect(`https://${shop}/admin/apps/bpp-20250814-final01`);
  } catch (err: any) {
    console.error("❌ CALLBACK ERROR", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
