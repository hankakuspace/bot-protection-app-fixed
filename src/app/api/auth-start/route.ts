// src/app/api/auth-start/route.ts
import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || "";
const SCOPES = process.env.SHOPIFY_SCOPES || "";

function getOrigin(req: NextRequest) {
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

function buildAuthorizeUrl(shop: string, redirectUri: string, state: string) {
  const u = new URL(`https://${shop}/admin/oauth/authorize`);
  u.searchParams.set("client_id", SHOPIFY_API_KEY);
  if (SCOPES) u.searchParams.set("scope", SCOPES);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("state", state);
  return u.toString();
}

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get("content-type") || "";
    const body = ct.includes("application/x-www-form-urlencoded")
      ? new URLSearchParams(await req.text())
      : await req.formData().catch(() => null);

    const shop =
      body instanceof URLSearchParams
        ? body.get("shop") || ""
        : typeof body?.get === "function"
        ? String(body.get("shop") || "")
        : "";

    if (!SHOPIFY_API_KEY) {
      return NextResponse.json({ ok: false, error: "missing SHOPIFY_API_KEY" }, { status: 500 });
    }
    if (!shop || !shop.endsWith(".myshopify.com")) {
      return NextResponse.json({ ok: false, error: "invalid shop" }, { status: 400 });
    }

    const origin = getOrigin(req);
    const redirectUri = `${origin}/api/auth/callback`;
    const state = crypto.randomUUID();
    const authorize = buildAuthorizeUrl(shop, redirectUri, state);

    const res = NextResponse.redirect(authorize, 302);
    // state Cookie をここで発行
    res.headers.append(
      "Set-Cookie",
      `shopify_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
    );
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// （任意）GET を叩かれてもルート確認できるように 200 を返す
export async function GET() {
  return NextResponse.json({ ok: true, note: "POST /api/auth-start to begin OAuth" });
}
