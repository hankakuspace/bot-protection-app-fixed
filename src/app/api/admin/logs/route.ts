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
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // ✅ createdAt を基準にソート
    let query = adminDb.collection("access_logs").orderBy("createdAt", "desc");

    if (from) {
      query = query.where("createdAt", ">=", new Date(from));
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      query = query.where("createdAt", "<=", toDate);
    }

    const snapshot = await query.offset(offset).limit(limit).get();

    const logs = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const ip = data.ip || "";
        let isAdmin = data.isAdmin ?? false;

        // ✅ 再判定して補正
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
        };
      })
    );

    return NextResponse.json({ logs });
  } catch (err: any) {
    console.error("logs API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
