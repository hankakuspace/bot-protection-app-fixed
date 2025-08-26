// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAppProxySignature } from "@/lib/verifyAppProxy";

export const runtime = "nodejs";

// 共通フォワード処理
async function forwardToInternal(req: NextRequest, slugParts: string[]) {
  // ✅ /log-access を内部APIに転送
  if (slugParts.length === 1 && slugParts[0] === "log-access") {
    const url = req.nextUrl;
    const queryString = url.searchParams.toString();
    const targetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/log-access${
      queryString ? `?${queryString}` : ""
    }`;

    const init: RequestInit = {
      method: req.method,
      headers: { "Content-Type": "application/json" },
    };

    if (req.method === "POST") {
      init.body = await req.text(); // bodyをそのまま転送
    }

    const resp = await fetch(targetUrl, init);
    const text = await resp.text();
    return new NextResponse(text, { status: resp.status });
  }

  return NextResponse.json(
    { ok: false, error: "Not found", slugParts },
    { status: 404 }
  );
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const result = verifyAppProxySignature(
    url,
    process.env.SHOPIFY_API_SECRET || ""
  );
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized", debug: result.debug },
      { status: 401 }
    );
  }

  const slugParts = url.pathname.split("/").filter(Boolean).slice(3); // /api/shopify/proxy/... の後ろ
  return forwardToInternal(req, slugParts);
}

export async function POST(req: NextRequest) {
  const url = req.nextUrl;
  const result = verifyAppProxySignature(
    url,
    process.env.SHOPIFY_API_SECRET || ""
  );
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized", debug: result.debug },
      { status: 401 }
    );
  }

  const slugParts = url.pathname.split("/").filter(Boolean).slice(3);
  return forwardToInternal(req, slugParts);
}
