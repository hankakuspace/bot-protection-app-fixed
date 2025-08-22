import { NextResponse } from "next/server";
import adminDb from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const ip = String(body.ip ?? "").trim();
    if (!ip) {
      return NextResponse.json({ ok: false, error: "IP required" }, { status: 400 });
    }

    await adminDb.collection("blocked_ips").doc(ip).delete();

    return NextResponse.json({ ok: true, removed: ip });
  } catch (err: any) {
    console.error("[API:delete-ip] error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
