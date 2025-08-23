import { NextRequest, NextResponse } from "next/server";
import {
  verifyAppProxySignature,
  isDebugEnabled,
} from "@/lib/shopifyProxy";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const params = url.searchParams;
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) throw new Error("SHOPIFY_API_SECRET is not set");

  // --- 署名検証 ---
  const result = verifyAppProxySignature(params, secret);
  if (!result.ok) {
    return NextResponse.json(
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
      { status: 401 }
    );
  }

  // --- App Proxy のルートアクセス時は /admin/logs を返す ---
  if (
    pathname.endsWith("/apps/bpp-20250814-final01") ||
    pathname.endsWith("/apps/bpp-20250814-final01/")
  ) {
    return NextResponse.rewrite(new URL("/admin/logs", req.url));
  }

  // --- ping テスト用 ---
  if (pathname.includes("/ping")) {
    return NextResponse.json(
      { ok: true, route: "ping", match: result.match },
      { status: 200 }
    );
  }

  // fallback
  return NextResponse.json(
    { ok: true, route: "default", match: result.match },
    { status: 200 }
  );
}
