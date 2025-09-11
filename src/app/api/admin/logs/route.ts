// src/app/api/admin/logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // 日付 (YYYY-MM-DD) とオフセットを取得
    const date = searchParams.get("date");
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const baseDate = date ? new Date(date) : new Date();
    const start = new Date(baseDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(baseDate);
    end.setHours(23, 59, 59, 999);

    const snapshot = await db
      .collection("access_logs")
      .where("createdAt", ">=", start)
      .where("createdAt", "<=", end)
      .orderBy("createdAt", "desc")
      .offset(offset)
      .limit(200)
      .get();

    const logs = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.createdAt ? data.createdAt.toDate().toISOString() : null,
      };
    });

    return NextResponse.json({
      ok: true,
      logs,
      hasMore: logs.length === 200,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

