// src/app/api/proxy/route.ts
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import geoip from "geoip-lite";

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
  const geo = ip !== "unknown" ? geoip.lookup(ip) || null : null;

  const doc = {
    ip,
    ua,
    country: geo?.country || "unknown",
    city: geo?.city || "unknown",
    timestamp: serverTimestamp(),
  };

  await addDoc(collection(db, "access_logs"), doc);

  const blockedIps = ["154.80.80.1"];

  if (blockedIps.includes(ip)) {
    return new NextResponse("Access Denied", { status: 403 });
  }

  return new NextResponse("OK", { status: 200 });
}
