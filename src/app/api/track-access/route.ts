// src/app/api/track-access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

function getCountry(req: NextRequest): string {
  const candidates = [
    req.headers.get("x-vercel-ip-country"),
    req.headers.get("cf-ipcountry"),
    req.headers.get("x-country-code"),
  ];

  for (const value of candidates) {
    const country = value?.trim().toUpperCase();
    if (country && country !== "XX") {
      return country;
    }
  }

  return "";
}

const TRANSPARENT_GIF = Uint8Array.from([
  71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 0, 0, 0, 255, 255, 255, 33,
  249, 4, 1, 0, 0, 1, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59,
]);

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const country = getCountry(req);
    const userAgent = req.headers.get("user-agent") || "unknown";
    const referer = req.headers.get("referer") || "";
    const page = req.nextUrl.searchParams.get("page") || "";
    const shop =
      req.nextUrl.searchParams.get("shop")?.trim().toLowerCase() ||
      "be-search.biz";
    const source = req.nextUrl.searchParams.get("source") || "theme";

    await adminDb.collection("access_logs").add({
      type: "theme-access",
      status: "loaded",
      blocked: false,
      ip,
      country,
      page,
      shop,
      source,
      path: page || "/",
      method: "GET",
      referer,
      userAgent,
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });

    return new NextResponse(TRANSPARENT_GIF, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Content-Length": String(TRANSPARENT_GIF.byteLength),
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("track-access error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to write access log",
      },
      { status: 500 },
    );
  }
}
