import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function DELETE(req: Request) {
  try {
    const { ip } = await req.json();
    if (!ip) {
      return NextResponse.json({ ok: false, error: "ip required" }, { status: 400 });
    }

    await adminDb.collection("blocked_ips").doc(ip).delete();

    return NextResponse.json({ ok: true, removed: true, ip });
  } catch (err) {
    console.error("[API:delete-ip] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
