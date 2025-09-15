// src/app/api/admin/blocked-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import admin from "firebase-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { ip, note } = await req.json();
    if (!ip) return NextResponse.json({ error: "Missing ip" }, { status: 400 });

    await adminDb.collection("blocked_ips").doc(ip).set({
      ip,
      note: note || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, ip });
  } catch (err: any) {
    console.error("blocked-ip error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
