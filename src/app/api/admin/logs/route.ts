// src/app/api/admin/logs/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await db
      .collection("access_logs")
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();

    const logs = snapshot.docs.map((doc) => {
      const data = doc.data();

      // ✅ サーバー時刻 or createdAt を必ず返す
      let ts: string | null = null;
      if (data.timestamp?.toDate) {
        ts = data.timestamp.toDate().toISOString();
      } else if (data.createdAt) {
        ts = data.createdAt;
      }

      return {
        id: doc.id,
        ip: data.ip || "UNKNOWN",
        country: data.country || "UNKNOWN",
        allowedCountry: data.allowedCountry ?? false,
        blocked: data.blocked ?? false,
        isAdmin: data.isAdmin ?? false,
        userAgent: data.userAgent || "UNKNOWN",
        timestamp: ts,                // ✅ 表示用
        rawTimestamp: data.timestamp || null, // デバッグ用に残す
        createdAt: data.createdAt || null,    // クライアント保存時刻
      };
    });

    return NextResponse.json({ ok: true, logs });
  } catch (error) {
    console.error("Error in logs:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
