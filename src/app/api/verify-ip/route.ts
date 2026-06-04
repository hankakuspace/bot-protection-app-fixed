// src/app/api/verify-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { isIpBlocked } from "@/lib/check-ip";
import { isCountryBlocked } from "@/lib/country-block";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  return "unknown";
}

function normalizeIp(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/^::ffff:/, "");
}

function getRequestPathFromBody(body: Record<string, unknown> | null): string {
  const bodyPath = typeof body?.path === "string" ? body.path : "";
  const bodyHref = typeof body?.href === "string" ? body.href : "";

  if (bodyPath.trim()) {
    return bodyPath.trim();
  }

  if (bodyHref.trim()) {
    try {
      const url = new URL(bodyHref);
      return `${url.pathname}${url.search}`;
    } catch {
      return "";
    }
  }

  return "";
}

function getShopFromBody(body: Record<string, unknown> | null): string {
  const bodyShop = typeof body?.shop === "string" ? body.shop : "";
  const bodyHref = typeof body?.href === "string" ? body.href : "";

  if (bodyShop.trim()) {
    return bodyShop.trim().toLowerCase();
  }

  if (bodyHref.trim()) {
    try {
      return new URL(bodyHref).hostname.toLowerCase();
    } catch {
      return "";
    }
  }

  return "";
}

function normalizeStorefrontShop(shop: string): string {
  const normalizedShop = shop.trim().toLowerCase();

  if (normalizedShop === "be-search.biz") {
    return "ruhra-store.myshopify.com";
  }

  return normalizedShop;
}

function buildCorsHeaders(request: NextRequest): HeadersInit {
  const origin = request.headers.get("origin") || "*";

  return {
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function getCountry(request: NextRequest): string {
  const candidates = [
    request.headers.get("x-vercel-ip-country"),
    request.headers.get("cf-ipcountry"),
    request.headers.get("x-country-code"),
  ];

  for (const value of candidates) {
    const country = value?.trim().toUpperCase();
    if (country && country !== "XX") {
      return country;
    }
  }

  return "";
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request),
  });
}

export async function POST(request: NextRequest) {
  let bodyIp = "";
  let shop = "";
  let requestPath = "";

  try {
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    bodyIp = normalizeIp(body?.ip);
    shop = getShopFromBody(body);
    requestPath = getRequestPathFromBody(body);
  } catch {
    bodyIp = "";
    shop = "";
    requestPath = "";
  }

  const headerIp = normalizeIp(getClientIp(request));
  const ip = bodyIp || headerIp || "unknown";
  const country = getCountry(request);
  const resolvedShop = normalizeStorefrontShop(shop || "be-search.biz");
  const corsHeaders = buildCorsHeaders(request);

  try {
    const ipBlocked =
      ip !== "unknown" ? await isIpBlocked(ip, resolvedShop) : false;
    const countryBlocked = await isCountryBlocked({
      shop: resolvedShop,
      country,
    });
    const blocked = ipBlocked || countryBlocked;
    const blockReason = ipBlocked
      ? "ip"
      : countryBlocked
        ? "country"
        : "";
    const logPath = blocked ? requestPath || "/" : "/api/verify-ip";

    await adminDb.collection("access_logs").add({
      type: "verify-ip",
      ip,
      status: blocked ? "blocked" : "allowed",
      blocked,
      blockReason,
      country,
      shop: resolvedShop,
      path: logPath,
      method: "POST",
      userAgent: request.headers.get("user-agent") || "",
      referer: request.headers.get("referer") || "",
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      {
        success: true,
        blocked,
        blockReason,
        ip,
        country,
        shop: resolvedShop,
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("verify-ip error:", error);

    try {
      await adminDb.collection("access_logs").add({
        type: "verify-ip",
        ip,
        status: "error",
        blocked: false,
        country,
        shop: resolvedShop,
        path: "/api/verify-ip",
        method: "POST",
        userAgent: request.headers.get("user-agent") || "",
        referer: request.headers.get("referer") || "",
        timestamp: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error("verify-ip log write error:", logError);
    }

    return NextResponse.json(
      {
        success: false,
        blocked: false,
        ip,
        error: "Failed to verify IP",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}
