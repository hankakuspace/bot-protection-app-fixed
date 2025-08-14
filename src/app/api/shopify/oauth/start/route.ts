import { NextResponse } from "next/server";
import crypto from "crypto";

const API_KEY = process.env.SHOPIFY_API_KEY || "";
const APP_URL = process.env.SHOPIFY_APP_URL || "";
const SCOPES = process.env.SHOPIFY_SCOPES || ""; // 例: "read_products", 空でもOK

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shop = (searchParams.get("shop") || "").toLowerCase();

  if (!API_KEY || !APP_URL) {
    return NextResponse.json({ ok: false, error: "missing env(API_KEY/APP_URL)" }, { status: 500 });
  }
  if (!shop.endsWith(".myshopify.com")) {
    return NextResponse.json({ ok: false, error: "invalid shop param" }, { status: 400 });
  }

  const state = crypto.randomBytes(16).toString("hex");
  const redirectUri = new URL("/api/shopify/oauth/callback", APP_URL).toString();

  const authUrl =
    `https://${shop}/admin/oauth/authorize?` +
    `client_id=${encodeURIComponent(API_KEY)}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}`;

  const res = NextResponse.redirect(authUrl, { status: 302 });
  // 10分だけ有効な state
  res.headers.set(
    "Set-Cookie",
    `shopify_state=${state}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax`
  );
  return res;
}
