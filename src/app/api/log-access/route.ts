// src/app/api/log-access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

async function getCountryFromIp(ip: string): Promise<string> {
  if (!ip || ip === "UNKNOWN") return "UNKNOWN";
  try {
    const token = process.env.IPINFO_TOKEN;
    const resp = await fetch(`https://ipinfo.io/${ip}/json?token=${token}`);
    if (!resp.ok) return "UNKNOWN";
    const data = await resp.json();
    return data.country || "UNKNOWN";
  } catch (e) {
    console.error("IP lookup failed:", e);
    return "UNKNOWN";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ip, isAdmin, userAgent, clientTime } = await req.json();

    // fallbackでサーバヘッダも確認
    let clientIp = ip;
    if (!clientIp || clientIp === "UNKNOWN") {
      clientIp =
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        "UNKNOWN";
      clientIp = clientIp.replace(/^::ffff:/, "");
    }

    const country = await getCountryFromIp(clientIp);
    const allowedCountry = country === "JP";
    const blocked = !allowedCountry;

    await db.collection("access_logs").add({
      ip: clientIp || "UNKNOWN",
      country,
      allowedCountry,
      blocked,
      isAdmin: !!isAdmin,
      userAgent: userAgent || "UNKNOWN",
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      clientTime: clientTime || new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      ip: clientIp,
      country,
      allowedCountry,
      blocked,
      isAdmin,
      userAgent,
    });
  } catch (err) {
    console.error("log-access error:", err);
    return NextResponse.json({ ok: false, error: "failed to log access" }, { status: 500 });
  }
}
