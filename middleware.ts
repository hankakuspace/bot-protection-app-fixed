// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // 管理画面の埋め込みページだけヘッダー付与（/app 配下のみ）
  if (req.nextUrl.pathname.startsWith('/app')) {
    res.headers.set(
      'Content-Security-Policy',
      "frame-ancestors https://admin.shopify.com https://*.myshopify.com;"
    );
    res.headers.set('Cache-Control', 'no-store');
  }
  return res;
}

// ← 対象を /app 配下に限定（/api や /apps プロキシには触れない）
export const config = {
  matcher: ['/app', '/app/:path*'],
};
