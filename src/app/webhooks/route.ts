// src/app/webhooks/route.ts
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getShopifySecret(): string {
  return process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_APP_SECRET || "";
}

function verifyShopifyWebhookHmac(rawBody: string, hmacHeader: string, secret: string): boolean {
  if (!rawBody || !hmacHeader || !secret) {
    return false;
  }

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, "utf8"),
      Buffer.from(hmacHeader, "utf8"),
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const secret = getShopifySecret();
  const rawBody = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256") || "";
  const topic = request.headers.get("x-shopify-topic") || "";
  const shop = request.headers.get("x-shopify-shop-domain") || "";

  if (!verifyShopifyWebhookHmac(rawBody, hmacHeader, secret)) {
    return NextResponse.json(
      { error: "Invalid webhook HMAC." },
      { status: 401 },
    );
  }

  console.log("✅ Shopify compliance webhook received", {
    topic,
    shop,
  });

  if (
    topic === "customers/data_request" ||
    topic === "customers/redact" ||
    topic === "shop/redact"
  ) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: true });
}
