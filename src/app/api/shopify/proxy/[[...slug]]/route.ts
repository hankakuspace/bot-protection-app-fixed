// FILE: src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  console.log("App Proxy HIT (slug):", req.url);

  return new NextResponse(
    `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Bot Protection UI</title>
        <style>
          body { font-family: sans-serif; padding: 2rem; }
          h1 { color: #333; }
          .box { background: #f9f9f9; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; }
        </style>
      </head>
      <body>
        <h1>🚀 Bot Protection App Proxy</h1>
        <div class="box">
          <p>Shopify App Proxy 経由の UI 表示テストです。</p>
          <p>ここに管理UIを組み込めます。</p>
        </div>
      </body>
      </html>
    `,
    {
      status: 200,
      headers: { "Content-Type": "text/html" },
    }
  );
}
