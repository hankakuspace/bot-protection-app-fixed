// middleware.ts （完全停止版）
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
export function middleware(_req: NextRequest) { return NextResponse.next(); }
// 何にもマッチさせない＝実質無効化
export const config = { matcher: ['/__noop__'] };
