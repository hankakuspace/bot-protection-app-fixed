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

    // ✅ 自動IDで複数件登録できるように変更
    await adminDb.collection("admin_ips").add({
      ip,
      note: note || "",
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("add-admin-ip error:", err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
