import { NextResponse } from "next/server";
import { verifyAppProxySignature } from "@/lib/verifyAppProxy";

const APP_SECRET =
  process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_APP_SECRET || "";

function unauthorized(reason: string, debug?: any) {
  if (debug) {
    console.error("Signature mismatch debug:", debug);
  }
  return NextResponse.json(
    { ok: false, error: "unauthorized", reason, debug },
    { status: 401 }
  );
}

async function handle(req: Request, method: "GET" | "POST", slug: string[]) {
  if (!APP_SECRET) {
    return NextResponse.json(
      { ok: false, error: "missing app secret" },
      { status: 500 }
    );
  }

  const { ok, reason, debug } = verifyAppProxySignature(new URL(req.url), APP_SECRET);
  if (!ok) return unauthorized(reason || "invalid signature", debug);

  if (method === "GET") {
    const query = Object.fromEntries(new URL(req.url).searchParams.entries());
    return NextResponse.json({ ok: true, via: "app-proxy", method, slug, query });
  } else {
    const bodyText = await req.text();
    return NextResponse.json({
      ok: true,
      via: "app-proxy",
      method,
      slug,
      bodyLen: bodyText.length,
    });
  }
}

export async function GET(req: Request, ctx: any) {
  const slug = Array.isArray(ctx?.params?.slug) ? ctx.params.slug : [];
  return handle(req, "GET", slug);
}

export async function POST(req: Request, ctx: any) {
  const slug = Array.isArray(ctx?.params?.slug) ? ctx.params.slug : [];
  return handle(req, "POST", slug);
}
