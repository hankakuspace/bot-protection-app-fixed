import { NextResponse } from "next/server";
import { verifyAppProxySignature } from "@/lib/verifyAppProxy";

const APP_SECRET =
  process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_APP_SECRET || "";

function unauthorized(reason: string) {
  return NextResponse.json(
    { ok: false, error: "unauthorized", reason },
    { status: 401 }
  );
}

async function handle(
  req: Request,
  method: "GET" | "POST",
  ctx: { params: { slug: string[] } } // ★ オプショナルを外す
) {
  if (!APP_SECRET) {
    return NextResponse.json(
      { ok: false, error: "missing app secret" },
      { status: 500 }
    );
  }

  // 署名検証（クエリのみが対象）
  const { ok, reason } = verifyAppProxySignature(new URL(req.url), APP_SECRET);
  if (!ok) return unauthorized(reason || "invalid signature");

  const slug = Array.isArray(ctx.params?.slug) ? ctx.params.slug : [];

  if (method === "GET") {
    const query = Object.fromEntries(new URL(req.url).searchParams.entries());
    return NextResponse.json({ ok: true, via: "app-proxy", method, slug, query });
  } else {
    const bodyText = await req.text(); // 必要に応じて JSON.parse
    return NextResponse.json({
      ok: true,
      via: "app-proxy",
      method,
      slug,
      bodyLen: bodyText.length,
    });
  }
}

export async function GET(
  req: Request,
  ctx: { params: { slug: string[] } } // ★ 型を固定
) {
  return handle(req, "GET", ctx);
}

export async function POST(
  req: Request,
  ctx: { params: { slug: string[] } } // ★ 型を固定
) {
  return handle(req, "POST", ctx);
}
