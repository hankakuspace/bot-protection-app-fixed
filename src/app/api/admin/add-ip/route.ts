// src/app/api/admin/add-ip/route.ts
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

    // Firestore に保存 (admin SDK は .doc().set を使用)
    await adminDb.collection("blocked_ips").doc(ip).set({
      ip,
      note: note || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("add-ip error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
