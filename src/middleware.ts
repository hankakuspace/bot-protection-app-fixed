// middleware.ts（最小：/?hmac|shop を /api/auth へ1回だけ送る）
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const u = req.nextUrl;
  if (u.pathname === '/' && (u.searchParams.has('hmac') || u.searchParams.has('shop'))) {
    return NextResponse.redirect(new URL('/api/auth' + u.search, u.origin));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/'] };
