// src/app/api/admin/ips/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await db
      .collection("access_logs")
      .orderBy("createdAt", "desc")
      .limit(50) // 最新50件だけ取得
      .get();

    const ips = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ip: data.ip || data.ip_v4 || data.ip_v6 || "UNKNOWN", // ✅ FirestoreにあるフィールドからIPを取る
      };
    });

    return NextResponse.json({ ok: true, ips });
  } catch (error: any) {
    console.error("🔥 Error in /api/admin/ips:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
