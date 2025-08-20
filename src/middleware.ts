// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkIp } from '@/lib/check-ip';

export async function middleware(req: NextRequest) {
  // 管理画面 (/admin) は常に許可
  if (req.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // ユーザーIPを取得
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.ip ||
    '0.0.0.0';

  // 判定ロジック
  const result = await checkIp(ip);

  if (result.isAdmin) {
    return NextResponse.next(); // 管理者は常に許可
  }

  if (result.blocked) {
    // ❌ ブロック → /blocked にリダイレクト
    return NextResponse.rewrite(new URL('/blocked', req.url));
  }

  // ✅ 許可
  return NextResponse.next();
}
