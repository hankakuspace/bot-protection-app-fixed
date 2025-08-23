// FILE: src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs"; // Firestoreや検証でNode.jsランタイム必須

/**
 * Shopify App Proxy リクエスト検証
 * @param req
 * @returns {boolean}
 */
function verifyProxySignature(req: NextRequest): boolean {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const signature = params.signature;
  delete params.signature;

  const keys = Object.keys(params).sort();
  const canonicalQuery = keys.map((k) => `${k}=${params[k]}`).join("\n"); // ✅ \n 区切り

  const expected = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET || "")
    .update(canonicalQuery)
    .digest("hex");

  return expected === signature;
}

export async function GET(req: NextRequest) {
  const valid = verifyProxySignature(req);

  if (!valid) {
    return NextResponse.json(
      { ok: false, match: false, error: "Invalid signature" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    ok: true,
    route: "proxy",
    match: true,
    shop: req.nextUrl.searchParams.get("shop"),
  });
}

export async function POST(req: NextRequest) {
  const valid = verifyProxySignature(req);

  if (!valid) {
    return NextResponse.json(
      { ok: false, match: false, error: "Invalid signature" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    return NextResponse.json({
      ok: true,
      route: "proxy",
      match: true,
      data: body,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}
