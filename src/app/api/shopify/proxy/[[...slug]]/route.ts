// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import {
  verifyAppProxySignature,
  extractClientIp,
  isDebugEnabled,
} from "@/lib/shopifyProxy";

export const runtime = "nodejs"; // ← Edge不可

type HandlerResult =
  | { ok: true; route: string; match: boolean; shop?: string; ip?: string }
  | Record<string, unknown>;

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
  // /api/shopify/proxy/<route> | /api/shopify/proxy/[[...slug]]
  // App Proxy 経由だと実際の path は /apps/<subpath>/<route> だが
  // Vercel 側エンドポイントは全てこのファイルに集約
  // ここではクエリ param の echo 用にダミー名称も許容
  const parts = pathname.split("/").filter(Boolean);
  // 末尾を route とみなす（/apps/<subpath>/<route> も /proxy/<route> も末尾は同じ）
  return parts[parts.length - 1] || "";
}

/** 署名必須なルートか？（/debug-params は DEBUG時のみ署名バイパス） */
function isSignatureRequired(route: string): boolean {
  if (route === "debug-params") return !isDebugEnabled() /* DEBUG時=不要 */;
  // それ以外は必須
  return true;
}

function getSecret(): string {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) throw new Error("SHOPIFY_API_SECRET is not set");
  return secret;
}

export async function GET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const route = getRouteFromPath(url.pathname); // ping | ip-check | echo | debug-params | etc.
  const params = url.searchParams;
  const secret = getSecret();

  // 署名チェック
  let match = false;
  let canonical = "";
  let providedSignature = "";
  let calculatedSignature = "";

  if (isSignatureRequired(route)) {
    const v = verifyAppProxySignature(params, secret);
    match = v.match;
    canonical = v.canonical;
    providedSignature = v.provided ?? "";
    calculatedSignature = v.calculated ?? "";
    if (!match) {
      return json(
        {
          ok: false,
          route,
          match,
          reason: "signature_mismatch",
          providedSignature,
          calculatedSignature,
          hint: "Shopify App Proxy の Client Secret と Vercel の SHOPIFY_API_SECRET を一致させてください。",
        },
        401
      );
    }
  } else {
    // DEBUGモード（署名バイパス）
    match = true;
  }

  // ルーティング
  switch (route) {
    case "ping": {
      const shop = params.get("shop") ?? undefined;
      const ip = extractClientIp(req);
      const data: HandlerResult = { ok: true, route: "ping", match, shop, ip };
      return json(data, 200);
    }

    case "ip-check": {
      const ip = extractClientIp(req);
      // ここで必要なら独自ロジック（国別制限・ブラックリストなど）を適用
      return json(
        {
          ok: true,
          route: "ip-check",
          match,
          ip,
          allowed: true, // 必要に応じて差し替え
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
          match,
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
      const v = verifyAppProxySignature(params, secret);
      const now = Math.floor(Date.now() / 1000);
      return json(
        {
          ok: true,
          route: "debug-params",
          debug: true,
          timestamp: now,
          canonical: v.canonical,
          providedSignature: v.provided,
          calculatedSignature: v.calculated,
          match: v.match,
          note:
            "DEBUG時のみ署名バイパスで到達可。canonical を openssl で検算して provided と一致するか確認してください。",
        },
        200
      );
    }

    default: {
      // 既定は /ping 相当の簡易応答（必要なら 404 にしても良い）
      const shop = params.get("shop") ?? undefined;
      const ip = extractClientIp(req);
      return json({ ok: true, route, match, shop, ip }, 200);
    }
  }
}
