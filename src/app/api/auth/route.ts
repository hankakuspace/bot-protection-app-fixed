// src/app/api/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase";

const SHOPIFY_API_KEY = (process.env.SHOPIFY_API_KEY || "").trim();
const SCOPES = (process.env.SHOPIFY_SCOPES || "").trim();

function getOrigin(req: NextRequest) {
  const fromEnv = (process.env.SHOPIFY_APP_URL || process.env.APP_URL || "").trim();
  if (fromEnv) {
    try {
      const u = new URL(fromEnv);
      return `${u.protocol}//${u.host}`;
    } catch {}
  }
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  console.log("🟢 HIT /api/auth", url.toString());

  const shop = url.searchParams.get("shop");
  const force = url.searchParams.get("force");

  if (!SHOPIFY_API_KEY) {
    return NextResponse.json({ error: "missing SHOPIFY_API_KEY" }, { status: 500 });
  }
  if (!shop || !shop.endsWith(".myshopify.com")) {
    return NextResponse.json({ error: "missing shop" }, { status: 400 });
  }

  const origin = getOrigin(req);
  const redirectUri = `${origin}/api/auth/callback`;

  const existing = await adminDb.collection("shops").doc(shop).get();

  // ✅ 既存ならダッシュボードへ直行（exitiframe は不要）
  if (existing.exists && !force) {
    console.log(`✅ Shop ${shop} already installed, skipping OAuth`);
    return NextResponse.redirect(`${origin}/admin/dashboard`);
  }

  // 🎉 新規インストール or 強制再認証 → OAuth 開始
  const state = crypto.randomUUID();
  await adminDb.collection("auth_states").doc(state).set({
    shop,
    state,
    timestamp: Date.now(),
  });

  const authorizeUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  authorizeUrl.searchParams.set("client_id", SHOPIFY_API_KEY);
  authorizeUrl.searchParams.set("scope", SCOPES);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);

  return NextResponse.redirect(authorizeUrl.toString(), { status: 302 });
}
