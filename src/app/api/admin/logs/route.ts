// src/app/api/admin/logs/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  try {
    const snapshot = await db
      .collection("access_logs")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    let logs = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        ip: data.ip || data.ip_v4 || data.ip_v6 || "UNKNOWN",
        country: data.country || "UNKNOWN",
        allowedCountry: data.allowedCountry ?? false,
        blocked: data.blocked ?? false,
        isAdmin: data.isAdmin ?? false,
        userAgent: data.userAgent || "UNKNOWN",
        host: data.host || "UNKNOWN",
        clientTime: data.clientTime || null,
        createdAt: data.createdAt?.toDate?.().toISOString() || null,
        // ✅ timestamp を必ず返す（UIで利用）
        timestamp:
          data.clientTime ||
          data.createdAt?.toDate?.().toISOString() ||
          null,
      };
    });

    // ✅ timestamp で降順
    logs.sort((a, b) => {
      if (!a.timestamp && b.timestamp) return 1;
      if (a.timestamp && !b.timestamp) return -1;
      if (a.timestamp && b.timestamp) {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      return 0;
    });

    return NextResponse.json({ ok: true, logs });
  } catch (error: any) {
    console.error("🔥 Error in /api/admin/logs:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
