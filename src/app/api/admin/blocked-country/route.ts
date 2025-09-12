// src/app/api/admin/blocked-country/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import admin from "firebase-admin";

export const runtime = "nodejs";

/**
 * 国ブロック登録API
 * - リクエスト: { id: string, note?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { id, note } = await req.json();

    if (!id || typeof id !== "string" || !/^[A-Z]{2}$/.test(id)) {
      return NextResponse.json(
        { ok: false, error: "Invalid country code (must be 2 letters)" },
        { status: 400 }
      );
    }

    await db.collection("block_countries").doc(id).set({
      enabled: true,
      note: note || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("[API] blocked-country added:", id);

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[API] Error in blocked-country POST:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
