// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ALLOW_PATHS = [
  /^\/admin(\/|$)/,          // 管理画面は常に許可
  /^\/api(\/|$)/,            // ← まとめて API を除外（これで /api/shopify/proxy も素通り）
  // もし細かく除外したいなら ↓ を使う:
  // /^\/api\/shopify(\/|$)/, // App Proxy 系は必ず除外
  // /^\/api\/auth(\/|$)/,    // Auth コールバック等も除外
  // /^\/api\/get-ip$/,       // get-ip を個別に除外したい場合は残す
  /^\/_next(\/|$)/,          // Nextの静的アセット
  /^\/favicon\.ico$/,
  /^\/robots\.txt$/,
  /^\/sitemap\.xml$/,
];

// 60秒以内は再送しない（タブ×ページ遷移でログ氾濫防止）
const THROTTLE_SECONDS = 60;
const FETCH_TIMEOUT_MS = 1500;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 許可リストに一致ならスルー（ここで /api は即スルー）
  if (ALLOW_PATHS.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  const isGet = req.method === 'GET';
  const accept = req.headers.get('accept') || '';
  const isHtml = accept.includes('text/html');
  if (!(isGet && isHtml)) {
    return NextResponse.next();
  }

  const lastPing = Number(req.cookies.get('ip_ping')?.value || '0');
  const now = Date.now();
  const shouldThrottle = lastPing && (now - lastPing) < THROTTLE_SECONDS * 1000;

  const resp = NextResponse.next();

  if (!shouldThrottle) {
    // /api/get-ip は middleware から除外済みでも問題なく叩けます
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
          const url = req.nextUrl.clone();
          url.pathname = '/blocked';
          return NextResponse.redirect(url);
        }
      }
    } catch {
      // タイムアウト・ネットワークエラーは可用性優先で通す
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
