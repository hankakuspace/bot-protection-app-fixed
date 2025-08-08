import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ALLOW_PATHS = [
  /^\/admin(\/|$)/,       // 管理画面は常に許可（必要なら削除）
  /^\/api\/get-ip$/,      // 自分自身は許可（ミドルウェアは通るが即スルー）
  /^\/_next(\/|$)/,       // Nextの静的アセット
  /^\/favicon\.ico$/,
  /^\/robots\.txt$/,
  /^\/sitemap\.xml$/,
];

// 60秒以内は再送しない（タブ×ページ遷移でログ氾濫防止）
const THROTTLE_SECONDS = 60;

// fetchタイムアウト（ms）
const FETCH_TIMEOUT_MS = 1500;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 許可リストに一致ならスルー
  if (ALLOW_PATHS.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  // HTMLドキュメントへのGETアクセスのみ対象（静的ファイルやXHRは除外）
  const isGet = req.method === 'GET';
  const accept = req.headers.get('accept') || '';
  const isHtml = accept.includes('text/html');
  if (!(isGet && isHtml)) {
    return NextResponse.next();
  }

  // 連打防止（Cookieベース）：最後の記録から60秒以内ならスキップ
  const lastPing = Number(req.cookies.get('ip_ping')?.value || '0');
  const now = Date.now();
  const shouldThrottle = lastPing && (now - lastPing) < THROTTLE_SECONDS * 1000;

  // ベースの応答（最後に Cookie を付与して返す）
  const resp = NextResponse.next();

  if (!shouldThrottle) {
    // /api/get-ip を叩いて最新判定＆ログ記録
    const base = process.env.NEXT_PUBLIC_BASE_URL || `${req.nextUrl.origin}`;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(`${base}/api/get-ip`, {
        headers: {
          // /api/get-ip で正しいIP/UAを得るためヘッダを引き継ぐ
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

  // ★ 管理者は常に許可（運用しやすくするため）
if (!isAdmin && blocked) {
  const url = req.nextUrl.clone();
  url.pathname = '/blocked';
  return NextResponse.redirect(url);
}
      }
      // res.okでない・JSON不正などは下で可用性優先スルー
    } catch (_err) {
      // タイムアウト・ネットワークエラー → 可用性優先で通す
      // console.warn('[middleware] get-ip fetch failed:', _err);
    }

    // 成功/失敗に関わらず、スロットル用Cookieをセット
    resp.cookies.set('ip_ping', String(now), {
      path: '/',
      maxAge: THROTTLE_SECONDS, // 秒
      httpOnly: false,
      sameSite: 'lax',
    });
  }

  return resp;
}

// どのパスに適用するか（省略可：全体適用）
export const config = {
  matcher: [
    '/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
