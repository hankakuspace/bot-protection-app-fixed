// src/app/api/shopify/proxy/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Shopify App Proxy からの到達確認用 兼 デバッグエンドポイント
 * - GET/POST どちらでも 200 を返す
 * - Vercel Logs に [app-proxy hit] を出す
 * - クエリ/一部ヘッダ/メソッド/URL を JSON で返す（本番では絞ってOK）
 */

function pickHeaders(req: NextRequest) {
  const h = req.headers;
  const keys = [
    "x-shopify-shop-domain",
    "x-shopify-shop-id",
    "x-shopify-storefront-access-token",
    "x-forwarded-for",
    "x-forwarded-proto",
    "x-real-ip",
    "user-agent",
    "accept-language",
  ];
  const out: Record<string, string | null> = {};
  for (const k of keys) out[k] = h.get(k);
  return out;
}

async function handle(req: NextRequest) {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const method = req.method;

  // 追加の debug: body も見たい時だけ拾う（POST/JSONフォームなど）
  let body: any = null;
  if (method !== "GET" && method !== "HEAD") {
    const ct = req.headers.get("content-type") || "";
    try {
      if (ct.includes("application/json")) {
        body = await req.json();
      } else if (ct.includes("application/x-www-form-urlencoded")) {
        const form = await req.formData();
        body = {};
        for (const [k, v] of form.entries()) body[k] = String(v);
      } else {
        body = await req.text();
      }
    } catch {
      body = "(unreadable)";
    }
  }

  // Vercel Logs に出す
  console.log("[app-proxy hit]", {
    path: url.pathname + url.search,
    method,
    shop: params["shop"] || req.headers.get("x-shopify-shop-domain") || null,
    headers: pickHeaders(req),
  });

  // `echo` が入っていたら、わかりやすく HTML で返す（ブラウザ確認用）
  if (params.echo) {
    const html = `<!doctype html>
<html><meta charset="utf-8"><body style="font-family:system-ui">
  <h1>App Proxy OK 🎉</h1>
  <p>method: <b>${method}</b></p>
  <p>url: <code>${url.pathname + url.search}</code></p>
  <h2>headers</h2>
  <pre>${JSON.stringify(pickHeaders(req), null, 2)}</pre>
  <h2>query</h2>
  <pre>${JSON.stringify(params, null, 2)}</pre>
  ${body ? `<h2>body</h2><pre>${JSON.stringify(body, null, 2)}</pre>` : ""}
</body></html>`;
    return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
  }

  // 既定は JSON
  return NextResponse.json(
    {
      ok: true,
      from: "shopify-app-proxy",
      method,
      path: url.pathname,
      query: params,
      headers: pickHeaders(req),
      note: "pass ?echo=1 to get a human-friendly HTML page",
    },
    { status: 200 }
  );
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}

// 念のため HEAD でも 200
export async function HEAD(_req: NextRequest) {
  return new Response(null, { status: 200 });
}
