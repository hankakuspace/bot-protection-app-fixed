// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAppProxySignature } from "@/lib/verifyAppProxy";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const result = verifyAppProxySignature(url, process.env.SHOPIFY_API_SECRET || "");

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized", debug: result.debug },
      { status: 401 }
    );
  }

  const pathPrefix = `/apps/${process.env.SHOPIFY_PROXY_SUBPATH}`;
  const internalPath = url.pathname.replace(pathPrefix, "");

  const queryString = url.searchParams.toString();
  const targetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${internalPath}${
    queryString ? `?${queryString}` : ""
  }`;

  try {
    const resp = await fetch(targetUrl, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { ok: false, error: "Internal API failed", status: resp.status, body: text },
        { status: 500 }
      );
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Proxy forward failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug?: string[] } }) {
  const url = req.nextUrl;
  const result = verifyAppProxySignature(url, process.env.SHOPIFY_API_SECRET || "");

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized", debug: result.debug },
      { status: 401 }
    );
  }

  const slug = params.slug || [];
  const pathPrefix = `/apps/${process.env.SHOPIFY_PROXY_SUBPATH}`;
  const internalPath = url.pathname.replace(pathPrefix, "");

  // ✅ log-access に対する POST を内部 API に転送
  if (slug.length === 1 && slug[0] === "log-access") {
    try {
      const body = await req.text();
      const targetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/log-access`;

      const resp = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      const data = await resp.json();
      return NextResponse.json(data, { status: resp.status });
    } catch (e: any) {
      return NextResponse.json(
        { ok: false, error: e?.message || "Proxy forward failed" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
}
