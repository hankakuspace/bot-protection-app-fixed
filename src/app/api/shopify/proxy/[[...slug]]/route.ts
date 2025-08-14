// src/app/api/shopify/proxy/[[...slug]]/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  paramsToObject,
  verifyAppProxySignature,
  extractClientIp,
  buildCanonicalQuery,
  hmacHex,
} from '@/lib/shopifyProxy';

export const runtime = 'nodejs'; // App Router / Node 実行（Edge不可）

function env(name: string): string | undefined {
  const v = process.env[name];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function json(data: unknown, init?: number | ResponseInit) {
  return NextResponse.json(data as any, init as any);
}

export async function GET(
  req: NextRequest,
  // Next.js 15 の型要件に合わせて「非オプショナル」に統一
  { params }: { params: { slug: string[] } }
) {
  // 未指定時の安全フォールバック
  const slugParts: string[] = Array.isArray((params as any)?.slug) ? (params as any).slug : [];
  const slug = slugParts.join('/'); // '', 'ping', 'ip-check', 'echo', 'debug-params' など

  const url = new URL(req.url);
  const search = url.searchParams;
  const q = paramsToObject(search);

  const DEBUG = !!env('DEBUG_PROXY');
  const SECRET = env('SHOPIFY_API_SECRET') || '';

  // --- DEBUG: /debug-params は DEBUG 時のみ開放（署名不要） ---
  if (slug === 'debug-params') {
    if (!DEBUG) return json({ ok: false, error: 'debug disabled' }, { status: 403 });

    const providedSignature = q['signature'];
    const canonical = buildCanonicalQuery(q);
    const computed = SECRET ? hmacHex(canonical, SECRET) : undefined;

    return json({
      ok: true,
      route: 'debug-params',
      query: q,
      providedSignature,
      canonicalUsedForSigning: canonical,
      computedSignature: computed,
      match: providedSignature && computed ? providedSignature === computed : false,
      meta: {
        pathPrefix: q['path_prefix'],
        shop: q['shop'],
        timestamp: q['timestamp'],
        note: 'DEBUG ONLY. Remove DEBUG_PROXY in production.',
      },
    });
  }

  // --- 以降は署名必須（/ping /echo /ip-check） ---
  if (!q['signature']) {
    // 署名がない → App Proxy 経由で来ていない可能性
    return json({ ok: false, error: 'signature required' }, { status: 401 });
  }
  if (!SECRET) {
    return json({ ok: false, error: 'server misconfig: SHOPIFY_API_SECRET is empty' }, { status: 500 });
  }

  const result = verifyAppProxySignature(q, SECRET);
  if (!result.ok) {
    return json(
      {
        ok: false,
        error: 'invalid signature',
        detail: DEBUG
          ? { provided: result.provided, computed: result.computed, canonical: result.canonical }
          : undefined,
      },
      { status: 401 }
    );
  }

  // --- 署名OK → ルーティング ---
  switch (slug) {
    case '':
      return json({ ok: true, route: 'root', message: 'App Proxy OK' });

    case 'ping':
      return json({ ok: true, route: 'ping', now: Date.now() });

    case 'echo':
      return json({
        ok: true,
        route: 'echo',
        query: q,
      });

    case 'ip-check': {
      const { ip, xff, realIp } = extractClientIp(req.headers);
      return json({
        ok: true,
        route: 'ip-check',
        ip,
        xForwardedFor: xff,
        xRealIp: realIp,
        headersSample: {
          cfConnectingIp: req.headers.get('cf-connecting-ip') ?? undefined,
          forwarded: req.headers.get('forwarded') ?? undefined,
          userAgent: req.headers.get('user-agent') ?? undefined,
        },
      });
    }

    default:
      return json({ ok: false, error: 'not found', slug }, { status: 404 });
  }
}

// POST も GET と同じ処理を適用
export async function POST(
  req: NextRequest,
  ctx: { params: { slug: string[] } }
) {
  return GET(req, ctx as any);
}
