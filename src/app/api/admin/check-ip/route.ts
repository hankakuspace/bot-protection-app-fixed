// src/app/api/admin/check-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ip = req.nextUrl.searchParams.get("ip");
  if (!ip) {
    return NextResponse.json({ ok: false, error: "Missing ip" }, { status: 400 });
  }

  try {
    const doc = await db.collection("block_ips").doc(ip).get();
    return NextResponse.json({ ok: true, blocked: doc.exists });
  } catch (e) {
    console.error("[API] check-ip error", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
