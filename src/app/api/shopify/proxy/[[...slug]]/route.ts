// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const params = Object.fromEntries(u.searchParams);

  // ログで確認
  console.log("[app-proxy hit]", u.pathname, params);

  // 絶対に見えるプレーンテキストで 200 を返す
  return new NextResponse(
    [
      "✅ App Proxy OK",
      `Shop: ${params.shop ?? "?"}`,
      `Path: ${u.pathname}`,
      `Time: ${new Date().toISOString()}`,
      "Query:",
      JSON.stringify(params, null, 2),
    ].join("\n"),
    {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    }
  );
}
