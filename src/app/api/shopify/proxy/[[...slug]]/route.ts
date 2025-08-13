import { NextRequest, NextResponse } from "next/server";

function pickHeaders(req: NextRequest) {
  const h = req.headers;
  const keys = [
    "x-shopify-shop-domain",
    "x-shopify-shop-id",
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

async function handle(req: NextRequest, context: any) {
  const url = new URL(req.url);
  const search = Object.fromEntries(url.searchParams.entries());

  // /api/shopify/proxy/:path* 経由でも /api/shopify/proxy?extra_path=... 経由でも拾えるように
  const slug = (context?.params?.slug as string[] | undefined) ?? [];
  const pathFromSlug = "/" + slug.join("/");
  const extraPath = (search["extra_path"] ? "/" + search["extra_path"] : "") || pathFromSlug;

  let body: any = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
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

  console.log("[app-proxy hit]", {
    method: req.method,
    path: extraPath || "/",
    url: url.pathname + url.search,
    shop: search["shop"] || req.headers.get("x-shopify-shop-domain"),
    headers: pickHeaders(req),
  });

  if (search.echo) {
    const html = `<!doctype html><meta charset="utf-8">
<body style="font-family:system-ui;line-height:1.5;padding:16px">
<h1>App Proxy OK 🎉</h1>
<p><b>method:</b> ${req.method}</p>
<p><b>path:</b> <code>${extraPath || "/"}</code></p>
<h2>headers</h2><pre>${JSON.stringify(pickHeaders(req), null, 2)}</pre>
<h2>query</h2><pre>${JSON.stringify(search, null, 2)}</pre>
${body ? `<h2>body</h2><pre>${JSON.stringify(body, null, 2)}</pre>` : ""}
</body>`;
    return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
  }

  return NextResponse.json(
    {
      ok: true,
      from: "shopify-app-proxy",
      method: req.method,
      path: extraPath || "/",
      query: search,
      headers: pickHeaders(req),
      note: "add ?echo=1 for HTML view",
    },
    { status: 200 }
  );
}

export async function GET(req: NextRequest, context: any) {
  return handle(req, context);
}
export async function POST(req: NextRequest, context: any) {
  return handle(req, context);
}
export async function HEAD(_req: NextRequest) {
  return new Response(null, { status: 200 });
}
