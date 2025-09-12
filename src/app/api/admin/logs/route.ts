// src/app/api/admin/logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // パラメータ取得
    const date = searchParams.get("date"); // YYYY-MM-DD
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10); // デフォルト100件

    // 日付範囲
    const baseDate = date ? new Date(date) : new Date();
    const start = new Date(baseDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(baseDate);
    end.setHours(23, 59, 59, 999);

    // Firestore クエリ
    const snapshot = await adminDb
      .collection("access_logs")
      .where("createdAt", ">=", start)
      .where("createdAt", "<=", end)
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
      hasMore: logs.length === limit, // limit件取れたらまだ続きがある
    });
  } catch (err: any) {
    console.error("ログ取得失敗:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
