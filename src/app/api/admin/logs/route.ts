// src/app/api/admin/logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // from/to で範囲を受け取る
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    if (!from || !to) {
      return NextResponse.json(
        { ok: false, error: "from と to が必要です" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1); // 翌日の0時まで含める

    const snapshot = await adminDb
      .collection("access_logs")
      .where("createdAt", ">=", fromDate)
      .where("createdAt", "<", toDate)
      .orderBy("createdAt", "desc")
      .offset(offset)
      .limit(limit)
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
      hasMore: logs.length === limit,
    });
  } catch (err: any) {
    console.error("ログ取得失敗:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
