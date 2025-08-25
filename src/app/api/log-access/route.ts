// src/app/api/log-access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import geoip from "geoip-lite";

export const runtime = "nodejs"; // ← Node.js runtimeで実行する

export async function POST(req: NextRequest) {
  try {
    const { ip, userAgent } = await req.json();
    const geo = geoip.lookup(ip);
    const country = geo ? geo.country : "UNKNOWN";

    const log = {
      ip,
      country,
      allowedCountry: country === "JP",
      blocked: false,
      isAdmin: false,
      userAgent,
      timestamp: new Date().toISOString(),
    };

    await db.collection("access_logs").add(log);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Failed to save access log:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
