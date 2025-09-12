// src/app/api/admin/ips/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("access_logs")
      .orderBy("createdAt", "desc")
      .limit(50) // 最新50件だけ取得
      .get();

    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ ok: true, logs });
  } catch (err: any) {
    console.error("ips API error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
