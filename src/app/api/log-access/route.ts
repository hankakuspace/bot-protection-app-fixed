// src/app/api/log-access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

async function getCountryFromIp(ip: string): Promise<string> {
  if (!ip || ip === "unknown") return "UNKNOWN";
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
    const { ip, isAdmin, userAgent: clientUA } = await req.json();

    // ✅ UA はクライアント送信があればそれを優先、なければリクエストヘッダ
    const userAgent = clientUA || req.headers.get("user-agent") || "UNKNOWN";

    if (
      userAgent.includes("vercel-favicon") ||
      userAgent.includes("vercel-screenshot")
    ) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const country = await getCountryFromIp(ip);
    const allowedCountry = country === "JP";
    const blocked = !allowedCountry;

    await db.collection("access_logs").add({
      ip: ip || "UNKNOWN",
      country,
      allowedCountry,
      blocked,
      isAdmin: !!isAdmin,
      userAgent, // ✅ ブラウザ由来のUAが優先
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      clientTime: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      ip,
      country,
      allowedCountry,
      blocked,
      isAdmin,
      userAgent,
    });
  } catch (err) {
    console.error("log-access error:", err);
    return NextResponse.json(
      { ok: false, error: "failed to log access" },
      { status: 500 }
    );
  }
}
