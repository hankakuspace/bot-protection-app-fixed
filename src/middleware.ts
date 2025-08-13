// src/middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * 許可パス：
 * - /api/* は OAuth や App Proxy を含むため “必ず素通し”
 * - ルート "/" は配布リンクの着地用（hmac/shop を保持したまま /api/auth へ一度だけ転送）
 * - Next静的/各種メタは除外
 */
const ALLOW_PATHS = [
  /^\/$/,                   // ルートは許可（OAuthクエリを受けるため）
  /^\/api(\/|$)/,           // API 全許可（/api/auth, /api/auth/callback, /api/shopify/proxy など）
  /^\/_next(\/|$)/,         // Next.js 静的アセット
  /^\/favicon\.ico$/,
  /^\/robots\.txt$/,
  /^\/sitemap\.xml$/,
  /^\/admin(\/|$)/,         // 管理UIを運用しているなら許可（任意）
];

// 60秒以内は再送しない（タブ遷移でのログ氾濫防止）
const THROTTLE_SECONDS = 60;
const FETCH_TIMEOUT_MS = 1500;

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname } = url;

  // 1) 許可パスは素通し。ただし "/" に OAuth クエリがある場合のみ /api/auth に一度だけ転送
  if (ALLOW_PATHS.some((re) => re.test(pathname))) {
    if (
      pathname === '/' &&
      (url.searchParams.has('hmac') || url.searchParams.has('shop'))
    ) {
      // クエリを保持したまま /api/auth に302
      return NextResponse.redirect(new URL('/api/auth' + url.search, url.origin));
    }
    return NextResponse.next();
  }

  // 2) 以降は HTML GET のみ IPブロック判定を実行（/api は上で素通しされる）
  const isGet = req.method === 'GET';
  const accept = req.headers.get('accept') || '';
  const isHtml = accept.includes('text/html');
  if (!(isGet && isHtml)) {
    return NextResponse.next();
  }

  const lastPing = Number(req.cookies.get('ip_ping')?.value || '0');
  const now = Date.now();
  const shouldThrottle = lastPing && now - lastPing < THROTTLE_SECONDS * 1000;

  const resp = NextResponse.next();

  if (!shouldThrottle) {
    // /api/get-ip は middleware の ALLOW_PATHS により到達可能
    const base = process.env.NEXT_PUBLIC_BASE_URL || `${req.nextUrl.origin}`;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(`${base}/api/get-ip`, {
        headers: {
          'x-forwarded-for': req.headers.get('x-forwarded-for') || '',
          'x-real-ip': req.headers.get('x-real-ip') || '',
          'user-agent': req.headers.get('user-agent') || '',
          'accept-language': req.headers.get('accept-language') || '',
        },
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(id);

      if (res.ok) {
        const data = await res.json();
        const isAdmin = !!data.isAdmin;
        const blocked = !!data.blocked;

        if (!isAdmin && blocked) {
          const redirectUrl = req.nextUrl.clone();
          redirectUrl.pathname = '/blocked';
          return NextResponse.redirect(redirectUrl);
        }
      }
    } catch {
      // タイムアウト/ネットワークエラーは可用性優先で通す
    }

    resp.cookies.set('ip_ping', String(now), {
      path: '/',
      maxAge: THROTTLE_SECONDS,
      httpOnly: false,
      sameSite: 'lax',
    });
  }

  return resp;
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)'],
};
