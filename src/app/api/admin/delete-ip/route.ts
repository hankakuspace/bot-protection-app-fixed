// src/app/api/admin/delete-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { ip } = await req.json();
    if (!ip) return NextResponse.json({ error: "Missing ip" }, { status: 400 });

    await adminDb.collection("blocked_ips").doc(ip).delete();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("delete-ip error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
