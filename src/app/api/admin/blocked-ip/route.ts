// src/app/api/admin/blocked-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import admin from "firebase-admin";

export const runtime = "nodejs";

/**
 * IPブロック登録API
 * - リクエスト: { id: string, note?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { id, note } = await req.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json({ ok: false, error: "IP is required" }, { status: 400 });
    }

    await db.collection("block_ips").doc(id).set({
      enabled: true,
      note: note || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("[API] blocked-ip added:", id);

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[API] Error in blocked-ip POST:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
