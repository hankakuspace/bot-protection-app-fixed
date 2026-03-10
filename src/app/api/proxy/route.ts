// src/app/api/proxy/route.ts
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");

  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    realIp ||
    cfConnectingIp ||
    "unknown";

  const ua = req.headers.get("user-agent") || "unknown";

  const doc = {
    ip,
    ua,
    country: "unknown",
    city: "unknown",
    timestamp: FieldValue.serverTimestamp(),
  };

  await adminDb.collection("access_logs").add(doc);

  const blockedIps = ["154.80.80.1"];

  if (blockedIps.includes(ip)) {
    return new NextResponse("Access Denied", { status: 403 });
  }

  return new NextResponse("OK", { status: 200 });
}
