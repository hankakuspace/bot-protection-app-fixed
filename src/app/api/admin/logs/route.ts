// src/app/api/admin/logs/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  try {
    const snapshot = await db
      .collection("access_logs")
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();

    const logs = snapshot.docs.map((doc) => {
      const data = doc.data();

      let ts: string | null = null;
      if (data.timestamp?.toDate) {
        ts = data.timestamp.toDate().toISOString();
      } else if (typeof data.timestamp === "string") {
        // ⚠️ 古い string timestamp は無視する → nullにする
        ts = null;
      }

      // createdAt fallback
      let createdAt: string | null = null;
      if (data.createdAt?.toDate) {
        createdAt = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === "string") {
        createdAt = data.createdAt;
      } else if (data.clientTime) {
        createdAt = String(data.clientTime);
      }

      if (!ts && createdAt) {
        ts = createdAt;
      }

      return {
        id: doc.id,
        ip: data.ip || "UNKNOWN",
        country: data.country || "UNKNOWN",
        allowedCountry: data.allowedCountry ?? false,
        blocked: data.blocked ?? false,
        isAdmin: data.isAdmin ?? false,
        userAgent: data.userAgent || "UNKNOWN",
        timestamp: ts,
        createdAt,
      };
    });

    // ✅ null timestamp の古いデータを除外
    const cleanedLogs = logs.filter((log) => log.timestamp !== null);

    return NextResponse.json(
      { ok: true, logs: cleanedLogs },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Error in logs:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
