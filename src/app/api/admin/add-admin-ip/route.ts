// src/app/api/admin/add-admin-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import admin from "firebase-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { ip, note } = await req.json();

    if (!ip) {
      return NextResponse.json({ error: "Missing IP" }, { status: 400 });
    }

    await adminDb.collection("blocked_ips").doc(ip).set({
      ip,
      note: note || "",
      isAdmin: true,
      blocked: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("add-admin-ip error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
