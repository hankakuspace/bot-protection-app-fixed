// src/middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ALLOW_PATHS = [
  /^\/$/,                   // ルート
  /^\/api(\/|$)/,           // API 全許可
  /^\/_next(\/|$)/,         // Next.js 静的アセット
  /^\/favicon\.ico$/,
  /^\/robots\.txt$/,
  /^\/sitemap\.xml$/,
  /^\/admin(\/|$)/,
];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // `/` に hmac または shop があれば `/api/auth` にリダイレクト
  if (
    pathname === '/' &&
    (url.searchParams.has('hmac') || url.searchParams.has('shop'))
  ) {
    return NextResponse.redirect(new URL('/api/auth' + url.search, url.origin));
  }

  // 許可パスはそのまま
  if (ALLOW_PATHS.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  // ここから先はIP制限やその他のロジック（必要なら残す）
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)'],
};
