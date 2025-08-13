// src/middleware.ts
// 一時停止版（すべて素通し）
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

// 何にもマッチさせない＝実質無効化
export const config = { matcher: ['/__no_middleware__'] };
