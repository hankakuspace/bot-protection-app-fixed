import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get('shop') ?? 'UNKNOWN';

  const html = `<!doctype html>
<html lang="ja"><meta charset="utf-8">
<title>App Proxy OK</title>
<body style="font:14px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;">
  <h1>✅ App Proxy OK</h1>
  <p>Shop: <b>${shop}</b></p>
  <p>Time: ${new Date().toISOString()}</p>
</body></html>`;

  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
