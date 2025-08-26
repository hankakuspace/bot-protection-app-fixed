// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAppProxySignature } from "@/lib/verifyAppProxy";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { slug?: string[] } }) {
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

  const slugParts = params.slug || [];

  if (slugParts.length === 1 && slugParts[0] === "log-access") {
    try {
      const queryString = url.searchParams.toString();
      const targetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/log-access${
        queryString ? `?${queryString}` : ""
      }`;

      const resp = await fetch(targetUrl, {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      const data = await resp.json();
      return NextResponse.json(data, { status: resp.status });
    } catch (e: any) {
      return NextResponse.json(
        { ok: false, error: e?.message || "Proxy forward failed (GET)" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { ok: false, error: "Not found", slugParts },
    { status: 404 }
  );
}

export async function POST(req: NextRequest, { params }: { params: { slug?: string[] } }) {
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

  const slugParts = params.slug || [];

  if (slugParts.length === 1 && slugParts[0] === "log-access") {
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
        { ok: false, error: e?.message || "Proxy forward failed (POST)" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { ok: false, error: "Not found", slugParts },
    { status: 404 }
  );
}
