// src/app/api/verify-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { isIpBlocked } from "@/lib/check-ip";
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

  try {
    const body = await request.json().catch(() => null);
    bodyIp = normalizeIp(body?.ip);
  } catch {
    bodyIp = "";
  }

  const headerIp = normalizeIp(getClientIp(request));
  const ip = bodyIp || headerIp || "unknown";
  const country = getCountry(request);
  const corsHeaders = buildCorsHeaders(request);

  try {
    const blocked = ip !== "unknown" ? await isIpBlocked(ip) : false;

    await adminDb.collection("access_logs").add({
      type: "verify-ip",
      ip,
      status: blocked ? "blocked" : "allowed",
      blocked,
      country,
      path: "/api/verify-ip",
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
        ip,
        country,
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
