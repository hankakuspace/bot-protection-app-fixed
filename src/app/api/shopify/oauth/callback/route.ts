// src/app/api/shopify/oauth/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const rawQuery = url.search.slice(1);
  const queryParams = Object.fromEntries(new URLSearchParams(url.search));

  const providedHmac = queryParams["hmac"] || "";
  const shop = queryParams["shop"] || "";
  const code = queryParams["code"] || "";
  const secret = process.env.SHOPIFY_API_SECRET || "";

  // canonical string (Shopify OAuth 仕様: hmac を除外 → key でソート)
  const { hmac: _h, ...rest } = queryParams;
  const canonical = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("&");

  const digest = crypto.createHmac("sha256", secret).update(canonical).digest("hex");

  // 🚩 デバッグ情報をそのまま返す
  return NextResponse.json({
    rawQuery,
    canonical,
    digest,
    providedHmac,
    match: digest === providedHmac.toLowerCase(),
    secretLength: secret.length,
    secretPreview: secret.substring(0, 6) + "...",
    shop,
    code,
  });
}
