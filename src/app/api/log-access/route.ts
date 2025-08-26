// src/app/api/log-access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getClientIp } from "@/lib/check-ip";

export const runtime = "nodejs";

/**
 * POST: ログを保存
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ip = getClientIp(req);
    const userAgent = body.userAgent || req.headers.get("user-agent") || "UNKNOWN";
    const clientTime = body.clientTime || null;

    await db.collection("access_logs").add({
      ip,
      country: body.country || "UNKNOWN",
      allowedCountry: body.allowedCountry ?? true,
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
 * GET: クエリパラメータ経由でログを保存
 * 例: /apps/bpp-20250814-final01/log-access?ua=xxx&t=2025-08-27T00:00:00Z
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ip = getClientIp(req);
    const userAgent = searchParams.get("ua") || req.headers.get("user-agent") || "UNKNOWN";
    const clientTime = searchParams.get("t") || null;

    await db.collection("access_logs").add({
      ip,
      country: searchParams.get("country") || "UNKNOWN",
      allowedCountry: searchParams.get("allowedCountry") === "true",
      blocked: searchParams.get("blocked") === "true",
      isAdmin: searchParams.get("isAdmin") === "true",
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
