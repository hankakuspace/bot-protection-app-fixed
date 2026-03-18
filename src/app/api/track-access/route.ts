// src/app/api/track-access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

const TRANSPARENT_GIF = Uint8Array.from([
  71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 0, 0, 0, 255, 255, 255, 33,
  249, 4, 1, 0, 0, 1, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59,
]);

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "unknown";
    const referer = req.headers.get("referer") || "";
    const page = req.nextUrl.searchParams.get("page") || "";
    const shop = req.nextUrl.searchParams.get("shop") || "";
    const source = req.nextUrl.searchParams.get("source") || "theme";

    await addDoc(collection(db, "access_logs"), {
      type: "theme-access",
      status: "loaded",
      blocked: false,
      ip,
      page,
      shop,
      source,
      path: page || "/",
      method: "GET",
      referer,
      userAgent,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("track-access error:", error);
  }

  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(TRANSPARENT_GIF.byteLength),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
