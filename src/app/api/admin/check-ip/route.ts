// src/app/api/admin/check-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { ip } = await req.json();
    if (!ip) {
      return NextResponse.json({ error: "Missing IP" }, { status: 400 });
    }

    const blocked = await adminDb.collection("blocked_ips").doc(ip).get();
    const adminIp = await adminDb.collection("admin_ips").doc(ip).get();

    return NextResponse.json({
      ip,
      isBlocked: blocked.exists,
      isAdmin: adminIp.exists,
    });
  } catch (err: any) {
    console.error("check-ip error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
