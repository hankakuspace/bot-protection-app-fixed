// src/app/api/admin/logs/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await db
      .collection("access_logs")
      .orderBy("timestamp", "desc")
      .limit(5) // 最新5件だけ
      .get();

    const logs = snapshot.docs.map((doc) => {
      const data = doc.data();

      // 🔍 デバッグログ出力
      console.log("DEBUG log document:", doc.id, data);

      let ts: string | null = null;
      if (data.timestamp?.toDate) {
        ts = data.timestamp.toDate().toISOString();
      }

      let createdAt: string | null = null;
      if (data.createdAt?.toDate) {
        createdAt = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === "string") {
        createdAt = data.createdAt;
      }

      if (!ts && createdAt) {
        ts = createdAt;
      }

      return {
        id: doc.id,
        ...data,
        timestamp: ts,
        createdAt,
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
