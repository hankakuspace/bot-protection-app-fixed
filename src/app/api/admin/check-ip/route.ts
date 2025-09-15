// src/app/api/admin/check-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ip = searchParams.get("ip");
    if (!ip) return NextResponse.json({ error: "Missing ip" }, { status: 400 });

    const snap = await adminDb.collection("blocked_ips").doc(ip).get();
    const blocked = snap.exists;

    return NextResponse.json({ ip, blocked });
  } catch (err: any) {
    console.error("check-ip error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
