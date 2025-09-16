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

    // ✅ logTimestamp に統一
    let query = adminDb.collection("access_logs").orderBy("logTimestamp", "desc");

    if (from) {
      query = query.where("logTimestamp", ">=", from);
    }
    if (to) {
      query = query.where("logTimestamp", "<=", to);
    }

    const snapshot = await query.offset(offset).limit(limit).get();

    const logs = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const ip = data.ip || "";
        let isAdmin = data.isAdmin ?? false;

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
          // ✅ 既存 createdAt を fallback に使用
          logTimestamp: data.logTimestamp || (data.createdAt?.toDate?.().toISOString() ?? null),
        };
      })
    );

    return NextResponse.json({ logs });
  } catch (err: any) {
    console.error("logs API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
