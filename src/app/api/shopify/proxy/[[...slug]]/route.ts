// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

function verifyProxySignature(req: NextRequest): boolean {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const signature = params.signature;
  delete params.signature;

  const keys = Object.keys(params).sort();
  const canonicalQuery = keys.map((k) => `${k}=${params[k]}`).join("\n");

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

  // Proxy経由では管理画面UIへリダイレクト
  return NextResponse.redirect(new URL("/admin/list-ip", req.nextUrl.origin));
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
