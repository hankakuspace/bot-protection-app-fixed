// src/app/api/admin/block-country/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { countryCode } = await req.json();
    if (!countryCode) {
      return NextResponse.json({ error: "Missing countryCode" }, { status: 400 });
    }

    // ✅ doc(countryCode) ではなく add() で自動IDに変更
    await adminDb.collection("blocked_countries").add({
      countryCode,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("block-country/add error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
