// src/app/api/admin/logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import { isAdminIp } from "@/lib/check-ip";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let query: FirebaseFirestore.Query = adminDb.collection("access_logs");

    // ✅ from ～ to の日付範囲を正しく設定
    if (from) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0); // 当日00:00:00から
      query = query.where("createdAt", ">=", fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999); // 当日23:59:59.999まで
      query = query.where("createdAt", "<=", toDate);
    }

    // ✅ createdAt 降順 + offset + limit
    query = query.orderBy("createdAt", "desc").offset(offset).limit(limit);

    const snapshot = await query.get();

    const logs = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const ip = data.ip || "";
        let isAdmin = data.isAdmin ?? false;

        // Firestoreに保存されているisAdminは無視、動的判定を優先
        if (ip) {
          const check = await isAdminIp(ip);
          if (check) {
            isAdmin = true;
          }
        }

        return {
          id: doc.id,
          ...data,
          isAdmin,
          // ✅ logTimestamp を優先、無ければ createdAt を ISO に変換
          logTimestamp:
            data.logTimestamp || data.createdAt?.toDate?.().toISOString() || null,
        };
      })
    );

    return NextResponse.json({ logs });
  } catch (err: any) {
    console.error("logs API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
