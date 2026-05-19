// src/app/auth/callback/route.ts
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

function getAppUrl(): string {
  return (
    process.env.SHOPIFY_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://bot-protection-ten.vercel.app"
  ).replace(/\/$/, "");
}

function getApiKey(): string {
  return process.env.SHOPIFY_API_KEY || process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "";
}

function getApiSecret(): string {
  return process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_APP_SECRET || "";
}

function isValidShop(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
}

function verifyHmac(searchParams: URLSearchParams, secret: string): boolean {
  const hmac = searchParams.get("hmac") || "";

  if (!hmac || !secret) {
    return false;
  }

  const params = Array.from(searchParams.entries())
    .filter(([key]) => key !== "hmac" && key !== "signature")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const digest = crypto.createHmac("sha256", secret).update(params).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(digest, "utf8"), Buffer.from(hmac, "utf8"));
  } catch {
    return false;
  }
}

function buildHost(shop: string): string {
  return Buffer.from(`${shop}/admin`, "utf8").toString("base64");
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shop = (searchParams.get("shop") || "").trim().toLowerCase();
  const code = searchParams.get("code") || "";
  const state = searchParams.get("state") || "";
  const storedState = request.cookies.get("shopify_oauth_state")?.value || "";
  const apiKey = getApiKey();
  const secret = getApiSecret();

  if (!shop || !isValidShop(shop)) {
    return new NextResponse("Invalid shop.", { status: 400 });
  }

  if (!code) {
    return new NextResponse("Missing authorization code.", { status: 400 });
  }

  if (!apiKey || !secret) {
    return new NextResponse("Missing Shopify app credentials.", { status: 500 });
  }

  if (!storedState || !state || storedState !== state) {
    return new NextResponse("Invalid OAuth state.", { status: 401 });
  }

  if (!verifyHmac(searchParams, secret)) {
    return new NextResponse("Invalid HMAC.", { status: 401 });
  }

  const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: apiKey,
      client_secret: secret,
      code,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    return new NextResponse(`Failed to exchange access token: ${errorText}`, {
      status: 502,
    });
  }

  const host = searchParams.get("host") || buildHost(shop);
  const appUrl = getAppUrl();
  const adminUrl = new URL(`${appUrl}/admin`);
  adminUrl.searchParams.set("shop", shop);
  adminUrl.searchParams.set("host", host);

  const response = NextResponse.redirect(adminUrl);
  response.cookies.delete("shopify_oauth_state");

  return response;
}
