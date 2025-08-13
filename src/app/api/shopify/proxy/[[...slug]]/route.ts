import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function html(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// ★ 第2引数（context）を受け取らない。URL からパスを抽出して可視化。
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const shop = url.searchParams.get('shop') || '(unknown shop)';

    // /api/shopify/proxy の後ろをそのまま表示（[[...slug]] 対応）
    const after = url.pathname.split('/api/shopify/proxy')[1] || '';
    const path = after || '/';

    const page = `
<!doctype html>
<html lang="ja"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bot Protection Proxy OK</title>
<style>
  body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;
       padding:24px; line-height:1.6}
  code{background:#f5f5f5;padding:.2em .4em;border-radius:6px}
</style>
<h1>✅ App Proxy OK</h1>
<p>Shop: <code>${shop}</code></p>
<p>Path: <code>${path}</code></p>
<p>Time: <code>${new Date().toISOString()}</code></p>
<p>このページが表示されれば、Shopify → Vercel のプロキシは疎通しています。</p>
`;
    return html(page);
  } catch (e: any) {
    return html(`<pre>error: ${e?.message || e}</pre>`, 500);
  }
}
