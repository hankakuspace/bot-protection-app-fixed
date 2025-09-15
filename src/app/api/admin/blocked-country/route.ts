// src/app/api/admin/blocked-country/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import admin from "firebase-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { id, note } = await req.json();

    if (!id || typeof id !== "string" || !/^[A-Z]{2}$/.test(id)) {
      return NextResponse.json(
        { ok: false, error: "Invalid country code" },
        { status: 400 }
      );
    }

    await adminDb.collection("blocked_countries").doc(id).set({
      enabled: true,
      note: note || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, id });
  } catch (err: any) {
    console.error("blocked-country error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
