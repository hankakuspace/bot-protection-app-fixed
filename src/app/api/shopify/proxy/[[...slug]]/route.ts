import { NextRequest, NextResponse } from "next/server";
import {
  verifyAppProxySignature,
  extractClientIp,
  isDebugEnabled,
  paramsToObject,
} from "@/lib/shopifyProxy";

export const runtime = "nodejs";

function json(data: any, init?: number | ResponseInit) {
  return new NextResponse(JSON.stringify(data), {
    ...(typeof init === "number" ? { status: init } : init),
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(typeof init === "object" ? init?.headers : {}),
    },
  });
}

function getRouteFromPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function getSecret(): string {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) throw new Error("SHOPIFY_API_SECRET is not set");
  return secret;
}

export async function GET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const route = getRouteFromPath(url.pathname);
  const params = url.searchParams;
  const secret = getSecret();

  const result = verifyAppProxySignature(params, secret);
  if (!result.ok) {
    return json(
      {
        ok: false,
        error: "invalid signature",
        detail: isDebugEnabled()
          ? {
              provided: result.provided,
              computed: result.computed,
              canonical: result.canonical,
            }
          : undefined,
      },
      401
    );
  }

  switch (route) {
    case "ping": {
      const shop = params.get("shop") ?? undefined;
      const { ip } = extractClientIp(req);
      return json(
        { ok: true, route: "ping", match: result.match, shop, ip },
        200
      );
    }

    case "ip-check": {
      const { ip, xff, realIp } = extractClientIp(req);
      return json(
        {
          ok: true,
          route: "ip-check",
          match: result.match,
          ip,
          xff,
          realIp,
        },
        200
      );
    }

    case "echo": {
      const headersPick = Object.fromEntries(
        ["host", "x-forwarded-for", "x-real-ip", "cf-connecting-ip"].map((h) => [
          h,
          req.headers.get(h),
        ])
      );
      return json(
        {
          ok: true,
          route: "echo",
          match: result.match,
          query: Object.fromEntries(params.entries()),
          headers: headersPick,
        },
        200
      );
    }

    case "debug-params": {
      if (!isDebugEnabled()) {
        return json({ ok: false, route, reason: "forbidden" }, 403);
      }
      return json(
        {
          ok: true,
          route: "debug-params",
          debug: true,
          timestamp: Math.floor(Date.now() / 1000),
          canonical: result.canonical,
          providedSignature: result.provided,
          computedSignature: result.computed,
          match: result.match,
        },
        200
      );
    }

    case "admin-logs": {
      // Shopify App Proxy からのアクセスを /admin/logs にリダイレクト
      return NextResponse.redirect(new URL("/admin/logs", req.url));
    }

    default: {
      return json(
        { ok: true, route, match: result.match, query: paramsToObject(params) },
        200
      );
    }
  }
}
