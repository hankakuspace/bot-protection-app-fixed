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

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  try {
    const blocked = ip !== "unknown" ? await isIpBlocked(ip) : false;

    await adminDb.collection("logs").add({
      type: "verify-ip",
      ip,
      status: blocked ? "blocked" : "allowed",
      path: "/api/verify-ip",
      userAgent: request.headers.get("user-agent") || "",
      referer: request.headers.get("referer") || "",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      {
        success: true,
        blocked,
        ip,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("verify-ip error:", error);

    try {
      await adminDb.collection("logs").add({
        type: "verify-ip",
        ip,
        status: "error",
        path: "/api/verify-ip",
        userAgent: request.headers.get("user-agent") || "",
        referer: request.headers.get("referer") || "",
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
      { status: 500 },
    );
  }
}
