import { NextResponse } from "next/server";
import { verifyAppProxySignature } from "@/lib/verifyAppProxy";
import { listIps } from "@/lib/ipStore";

/**
 * 環境変数
 * - SHOPIFY_APP_SECRET / SHOPIFY_API_SECRET: App Proxy 署名検証用シークレット
 * - APP_PROXY_SECRET_MAP: パスプレフィックス別のシークレット上書き（例 "/apps/bpp-20250814=shpss_xxx;/apps/ps-xyz=shpss_yyy"）
 * - APP_PROXY_SIGNATURE_MAX_AGE: 署名の有効秒数（デフォルト 300）
 * - SHOPIFY_SHOP_DOMAIN: 許可する myshopify ドメイン（例 "ruhra-store.myshopify.com"）未設定ならチェックなし
 */

const NODE_ENV = process.env.NODE_ENV || "production";
const DEFAULT_SECRET =
  process.env.SHOPIFY_APP_SECRET || process.env.SHOPIFY_API_SECRET || "";
const EXPECTED_SHOP = (process.env.SHOPIFY_SHOP_DOMAIN || "").toLowerCase();
const MAX_AGE = parseInt(process.env.APP_PROXY_SIGNATURE_MAX_AGE || "300", 10);

// 許可スラッグ（最初は最小に）
const ALLOW_SLUGS = new Set<string>(["ping"]);

// path_prefix ごとに Secret を差し替えるためのマップを作る
function parseSecretMap() {
  const raw = process.env.APP_PROXY_SECRET_MAP || "";
  const map: Record<string, string> = {};
  raw.split(";").forEach((p) => {
    const [k, v] = p.split("=");
    if (k && v) map[k.trim()] = v.trim();
  });
  return map;
}
const SECRET_MAP = parseSecretMap();

function secretForPathPrefix(prefix: string) {
  return SECRET_MAP[prefix] || DEFAULT_SECRET;
}

// URL から /api/shopify/proxy/ 以降の slug 配列を取り出す（Nextの params 型に依存しない）
function extractSlug(pathname: string): string[] {
  const base = "/api/shopify/proxy";
  if (!pathname.startsWith(base)) return [];
  const rest = pathname.slice(base.length); // e.g. "/ping" or "/ping/x"
  return rest.replace(/^\/+/, "").split("/").filter(Boolean);
}

function json(body: any, init?: ResponseInit) {
  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
    ...init,
  });
}

async function handle(req: Request, method: "GET" | "POST") {
  const url = new URL(req.url);
  const sp = url.searchParams;

  // Shopify App Proxy 固有のパラメータ
  const shop = (sp.get("shop") || "").toLowerCase();
  const pathPrefix = sp.get("path_prefix") || ""; // e.g. "/apps/bpp-20250814"
  const appSecret = secretForPathPrefix(pathPrefix);

  // 署名検証
  if (!appSecret) {
    return json({ ok: false, error: "missing app secret" }, { status: 500 });
  }
  const sig = verifyAppProxySignature(url, appSecret, MAX_AGE);

  if (!sig.ok) {
    const payload: any = { ok: false, error: "unauthorized", reason: sig.reason };
    if (NODE_ENV !== "production") payload.debug = sig.debug;
    return json(payload, { status: 401 });
  }

  // shop ドメイン制限（必要な場合のみ）
  if (EXPECTED_SHOP && shop && shop !== EXPECTED_SHOP) {
    return json({ ok: false, error: "forbidden shop", shop }, { status: 403 });
  }

  // クライアントIPブロック（x-forwarded-for の先頭を採用）
  const xfwd = req.headers.get("x-forwarded-for") || "";
  const clientIp = xfwd.split(",")[0]?.trim() || "";
  if (clientIp) {
    const blocked = await listIps();
    if (blocked.includes(clientIp)) {
      return json({ ok: false, error: "blocked ip", ip: clientIp }, { status: 403 });
    }
  }

  // 許可スラッグ判定
  const slug = extractSlug(url.pathname);
  if (!slug.length || !ALLOW_SLUGS.has(slug[0])) {
    return json({ ok: false, error: "forbidden path", slug }, { status: 403 });
  }

  // ---- ハンドラ群 ----
  if (slug[0] === "ping") {
    if (method === "GET") {
      return json({
        ok: true,
        via: "app-proxy",
        method,
        slug,
        query: Object.fromEntries(sp.entries()),
      });
    }
    if (method === "POST") {
      const bodyText = await req.text();
      let echo: any = undefined;
      try {
        echo = JSON.parse(bodyText);
      } catch {
        // 非JSONはそのまま長さのみ返す
      }
      return json({
        ok: true,
        via: "app-proxy",
        method,
        slug,
        size: bodyText.length,
        echo,
      });
    }
  }

  // ここに他の許可スラッグ（例: verify）を追加していく
  // if (slug[0] === "verify") { ... }

  // 予期しない分岐
  return json({ ok: false, error: "not found", slug }, { status: 404 });
}

// Next.js Route Handlers: params 型に依存せず第二引数なしで実装（型エラー回避）
export async function GET(req: Request) {
  return handle(req, "GET");
}
export async function POST(req: Request) {
  return handle(req, "POST");
}
