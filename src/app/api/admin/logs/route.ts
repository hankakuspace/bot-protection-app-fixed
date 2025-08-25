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

      // ✅ サーバー時刻が優先、無ければ createdAt を使用
      const ts = data.timestamp?.toDate
        ? data.timestamp.toDate().toISOString()
        : data.createdAt || null;

      return {
        id: doc.id,
        ...data,
        timestamp: ts,   // 表示用 timestamp
        createdAt: data.createdAt || null, // 念のため raw createdAt も返す
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
