import { NextResponse } from "next/server";
import { verifyAppProxySignature } from "@/lib/verifyAppProxy";

// --- allowlist（許可するサブパス）---
const ALLOW_SLUGS = new Set<string>([
  "",       // /api/shopify/proxy
  "ping",   // /api/shopify/proxy/ping
  // 今後使うものをここに追加: "orders", "status", ...
]);

function isAllowed(slug: string[]) {
  if (slug.length === 0) return ALLOW_SLUGS.has("");
  if (slug.length === 1) return ALLOW_SLUGS.has(slug[0]);
  return false; // ネストは不許可（必要なら緩める）
}

// 許可する shop ドメイン
const SHOP_ALLOWLIST = new Set<string>(["ruhra-store.myshopify.com"]);

const APP_SECRET =
  process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_APP_SECRET || "";

// 統一 401 応答（レスポンスに debug は含めない）
function unauthorized(reason: string, debug?: any) {
  if (debug) console.error("Signature mismatch debug:", debug);
  return NextResponse.json({ ok: false, error: "unauthorized", reason }, { status: 401 });
}

function noStoreJson(body: any, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function handle(req: Request, method: "GET" | "POST", slug: string[]) {
  if (!APP_SECRET) {
    return noStoreJson({ ok: false, error: "missing app secret" }, 500);
  }

  // 署名 + timestamp 鮮度（±5分）
  const { ok, reason, debug } = verifyAppProxySignature(new URL(req.url), APP_SECRET, 300);
  if (!ok) return unauthorized(reason || "invalid signature", debug);

  // shop ホワイトリスト
  const sp = new URL(req.url).searchParams;
  const shop = sp.get("shop");
  if (!shop || !SHOP_ALLOWLIST.has(shop)) {
    return noStoreJson({ ok: false, error: "forbidden shop" }, 403);
  }

  // パス allowlist
  if (!isAllowed(slug)) {
    return noStoreJson({ ok: false, error: "forbidden path" }, 403);
  }

  // --- ここから本来の処理 ---
  if (method === "GET") {
    const query = Object.fromEntries(new URL(req.url).searchParams.entries());
    console.log("APP_PROXY_OK", { slug, method, query });
    return noStoreJson({ ok: true, via: "app-proxy", method, slug, query });
  } else {
    // POST: サイズ制限 + JSONバリデーション（必要最小限）
    const contentType = req.headers.get("content-type") || "";
    const raw = await req.text();

    if (raw.length > 64 * 1024) {
      return noStoreJson({ ok: false, error: "payload too large" }, 413);
    }

    let payload: any = raw;
    if (contentType.includes("application/json")) {
      try {
        payload = raw ? JSON.parse(raw) : {};
      } catch {
        return noStoreJson({ ok: false, error: "invalid json" }, 400);
      }
    }
    console.log("APP_PROXY_OK", { slug, method, size: raw.length });

    // /ping のときだけ echo（デバッグ用途／本番では不要なら削除）
    const responseBody: any = {
      ok: true,
      via: "app-proxy",
      method,
      slug,
      size: raw.length,
    };
    if (slug[0] === "ping") responseBody.echo = payload;

    return noStoreJson(responseBody);
  }
}

// Next.js 15 の型判定を避けるため ctx は any で受ける
export async function GET(req: Request, ctx: any) {
  const slug = Array.isArray(ctx?.params?.slug) ? ctx.params.slug : [];
  return handle(req, "GET", slug);
}

export async function POST(req: Request, ctx: any) {
  const slug = Array.isArray(ctx?.params?.slug) ? ctx.params.slug : [];
  return handle(req, "POST", slug);
}
