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

      // ✅ サーバー時刻優先、なければ createdAt を利用
      const ts = data.timestamp?.toDate
        ? data.timestamp.toDate().toISOString()
        : (typeof data.createdAt === "string" ? data.createdAt : null);

      return {
        id: doc.id,
        ip: data.ip || "UNKNOWN",
        country: data.country || "UNKNOWN",
        allowedCountry: data.allowedCountry ?? false,
        blocked: data.blocked ?? false,
        isAdmin: data.isAdmin ?? false,
        userAgent: data.userAgent || "UNKNOWN",
        timestamp: ts,                                // ✅ 表示用
        createdAt: typeof data.createdAt === "string" // ✅ 文字列ならそのまま返す
          ? data.createdAt
          : null,
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
