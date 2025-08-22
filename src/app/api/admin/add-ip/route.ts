import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { ip } = await req.json();
    if (!ip) {
      return NextResponse.json({ ok: false, error: "ip required" }, { status: 400 });
    }

    await adminDb.collection("blocked_ips").doc(ip).set({
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, added: true, ip });
  } catch (err) {
    console.error("[API:add-ip] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
