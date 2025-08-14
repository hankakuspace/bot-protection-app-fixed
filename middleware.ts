import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  // Shopify Admin 埋め込みに必要（X-Frame-Options は設定しない）
  if (req.nextUrl.pathname.startsWith('/app')) {
    res.headers.set(
      'Content-Security-Policy',
      "frame-ancestors https://admin.shopify.com https://*.myshopify.com;"
    );
    res.headers.set('Cache-Control', 'no-store');
  }
  return res;
}
