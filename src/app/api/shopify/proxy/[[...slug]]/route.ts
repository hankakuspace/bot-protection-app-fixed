import { NextRequest, NextResponse } from "next/server";
import { verifyAppProxySignature } from "@/lib/verifyAppProxy";

const APP_SECRET = process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_APP_SECRET || "";

function unauthorized(reason: string) {
  return NextResponse.json({ ok: false, error: "unauthorized", reason }, { status: 401 });
}

async function handle(req: NextRequest, method: "GET" | "POST", slug: string[]) {
  if (!APP_SECRET) return NextResponse.json({ ok: false, error: "missing app secret" }, { status: 500 });

  const { ok, reason } = verifyAppProxySignature(new URL(req.url), APP_SECRET);
  if (!ok) return unauthorized(reason || "invalid signature");

  // ★ ここから本来の処理
  if (method === "GET") {
    const query = Object.fromEntries(new URL(req.url).searchParams.entries());
    return NextResponse.json({ ok: true, via: "app-proxy", method, slug, query });
  } else {
    const body = await req.text(); // 必要なら JSON.parse
    return NextResponse.json({ ok: true, via: "app-proxy", method, slug, bodyLen: body.length });
  }
}

export async function GET(req: NextRequest, { params }: { params: { slug?: string[] } }) {
  const slug = params.slug || [];
  return handle(req, "GET", slug);
}

export async function POST(req: NextRequest, { params }: { params: { slug?: string[] } }) {
  const slug = params.slug || [];
  return handle(req, "POST", slug);
}
