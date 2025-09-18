// src/app/api/admin/blocked-country/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { countryCode } = await req.json();
    if (!countryCode) {
      return NextResponse.json({ error: "Missing countryCode" }, { status: 400 });
    }

    await adminDb.collection("blocked_countries").doc(countryCode).set({
      countryCode,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("blocked-country error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
