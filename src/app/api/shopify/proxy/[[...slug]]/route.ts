// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextResponse } from 'next/server';
import {
  paramsToObject,
  verifyAppProxySignature,
  extractClientIp,
  buildCanonicalQuery,
  hmacHex,
} from '@/lib/shopifyProxy';

export const runtime = 'nodejs'; // Node 実行（Edge不可）

function env(name: string): string | undefined {
  const v = process.env[name];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function json(data: unknown, init?: number | ResponseInit) {
  return NextResponse.json(data as any, init as any);
}

/** ctx.params.slug を安全に string[] 化 */
function getSlugParts(ctx: any): string[] {
  const raw = ctx?.params?.slug;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.length) return [raw];
  return [];
}

export async function GET(
  req: Request,
  // Next.js 15 の型検証を確実に通すため any を使用（実値は関数内で厳密にガード）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any
) {
  const slug = getSlugParts(ctx).join('/'); // '', 'ping', 'ip-check', 'echo', 'debug-params'
  const url = new URL(req.url);
  const q = paramsToObject(url.searchParams);

  const DEBUG = !!env('DEBUG_PROXY');
  const SECRET = env('SHOPIFY_API_SECRET') || '';

  // --- DEBUG: 署名不要で内部情報を返す ---
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

  // --- 以降は署名必須 ---
  if (!q['signature']) {
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
      return json({ ok: true, route: 'echo', query: q });

    case 'ip-check': {
      const { ip, xff, realIp } = extractClientIp(req.headers as unknown as Headers);
      return json({
        ok: true,
        route: 'ip-check',
        ip,
        xForwardedFor: xff,
        xRealIp: realIp,
        headersSample: {
          cfConnectingIp: (req.headers as any).get?.('cf-connecting-ip') ?? undefined,
          forwarded: (req.headers as any).get?.('forwarded') ?? undefined,
          userAgent: (req.headers as any).get?.('user-agent') ?? undefined,
        },
      });
    }

    default:
      return json({ ok: false, error: 'not found', slug }, { status: 404 });
  }
}

// POST も GET と同じ処理
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: Request, ctx: any) {
  return GET(req, ctx);
}
