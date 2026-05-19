// src/app/auth/route.ts
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shop = (searchParams.get("shop") || "").trim().toLowerCase();
  const host = searchParams.get("host") || "";
  const apiKey = getApiKey();
  const secret = getApiSecret();
  const appUrl = getAppUrl();

  if (!shop || !isValidShop(shop)) {
    return new NextResponse("Invalid shop.", { status: 400 });
  }

  if (!apiKey || !secret) {
    return new NextResponse("Missing Shopify app credentials.", { status: 500 });
  }

  if (searchParams.get("hmac") && !verifyHmac(searchParams, secret)) {
    return new NextResponse("Invalid HMAC.", { status: 401 });
  }

  const redirectUri = `${appUrl}/auth/callback`;
  const state = crypto.randomBytes(16).toString("hex");

  const authorizeUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  authorizeUrl.searchParams.set("client_id", apiKey);
  authorizeUrl.searchParams.set("scope", process.env.SHOPIFY_SCOPES || "");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);

  if (host) {
    authorizeUrl.searchParams.set("host", host);
  }

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("shopify_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
