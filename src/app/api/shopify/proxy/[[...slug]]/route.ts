import { NextResponse } from "next/server";
import { verifyAppProxySignature } from "@/lib/verifyAppProxy";

// --- allowlist（許可するパスだけ通す）---
const ALLOW_SLUGS = new Set<string>([
  "",        // ルート: /api/shopify/proxy
  "ping",    // /api/shopify/proxy/ping
  // 必要に応じて追加:
  "orders",
  "status",
]);

function isAllowed(slug: string[]) {
  if (slug.length === 0) return ALLOW_SLUGS.has("");
  if (slug.length === 1) return ALLOW_SLUGS.has(slug[0]);
  return false; // ネストは不許可（必要なら緩める）
}

const APP_SECRET =
  process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_APP_SECRET || "";

// 401 JSON を統一フォーマットで返す（デバッグも同梱可）
function unauthorized(reason: string, debug?: any) {
  if (debug) console.error("Signature mismatch debug:", debug);
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

  // 署名 + timestamp 鮮度チェック（±5分 = 300秒）
  const { ok, reason, debug } = verifyAppProxySignature(
    new URL(req.url),
    APP_SECRET,
    300
  );
  if (!ok) return unauthorized(reason || "invalid signature", debug);

  // allowlist チェック
  if (!isAllowed(slug)) {
    return NextResponse.json(
      { ok: false, error: "forbidden path" },
      { status: 403 }
    );
  }

  // --- 本来の処理 ---
  if (method === "GET") {
    const query = Object.fromEntries(new URL(req.url).searchParams.entries());
    console.log("APP_PROXY_OK", { slug, method, query });
    return NextResponse.json({
      ok: true,
      via: "app-proxy",
      method,
      slug,
      query,
    });
  } else {
    const bodyText = await req.text(); // 必要に応じて JSON.parse(bodyText)
    console.log("APP_PROXY_OK", { slug, method, bodyLen: bodyText.length });
    return NextResponse.json({
      ok: true,
      via: "app-proxy",
      method,
      slug,
      bodyLen: bodyText.length,
    });
  }
}

// Next.js 15 の型チェック回避のため ctx は any で受ける
export async function GET(req: Request, ctx: any) {
  const slug = Array.isArray(ctx?.params?.slug) ? ctx.params.slug : [];
  return handle(req, "GET", slug);
}

export async function POST(req: Request, ctx: any) {
  const slug = Array.isArray(ctx?.params?.slug) ? ctx.params.slug : [];
  return handle(req, "POST", slug);
}
