// src/app/api/log-access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getClientIp } from "@/lib/check-ip";

export const runtime = "nodejs";

async function getCountryFromIp(ip: string): Promise<{ country: string; allowed: boolean }> {
  try {
    const token = process.env.IPINFO_TOKEN;
    if (!token || ip === "UNKNOWN") return { country: "UNKNOWN", allowed: false };

    const res = await fetch(`https://ipinfo.io/${ip}?token=${token}`);
    if (!res.ok) return { country: "UNKNOWN", allowed: false };

    const data = await res.json();
    const country = data.country || "UNKNOWN";
    return { country, allowed: country === "JP" };
  } catch {
    return { country: "UNKNOWN", allowed: false };
  }
}

/**
 * POST
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ip = await getClientIp(req); // ← await を追加

    const { country, allowed } = await getCountryFromIp(ip);

    const userAgent = body.userAgent || req.headers.get("user-agent") || "UNKNOWN";
    const clientTime = body.clientTime || null;

    await db.collection("access_logs").add({
      ip,
      country,
      allowedCountry: allowed,
      blocked: body.blocked ?? false,
      isAdmin: body.isAdmin ?? false,
      userAgent,
      host: req.headers.get("host") || null,
      createdAt: new Date(),
      clientTime,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * GET
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ip = await getClientIp(req); // ← await を追加

    const { country, allowed } = await getCountryFromIp(ip);

    const userAgent = searchParams.get("ua") || req.headers.get("user-agent") || "UNKNOWN";
    const clientTime = searchParams.get("t") || null;

    await db.collection("access_logs").add({
      ip,
      country,
      allowedCountry: allowed,
      blocked: searchParams.get("blocked") === "true",
      isAdmin: searchParams.get("isAdmin") === "true",
      userAgent,
      host: req.headers.get("host") || null,
      createdAt: new Date(),
      clientTime,
    });

    return NextResponse.json({ ok: true, country, allowedCountry: allowed });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
