import { NextResponse } from "next/server";
import adminDb from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ip = String(body.ip ?? "").trim();
    if (!ip) {
      return NextResponse.json({ ok: false, error: "IP required" }, { status: 400 });
    }

    await adminDb.collection("blocked_ips").doc(ip).set({
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, added: ip });
  } catch (err: any) {
    console.error("[API:add-ip] error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
