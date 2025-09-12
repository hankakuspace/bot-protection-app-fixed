// src/app/api/admin/usage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    if (!shop) {
      return NextResponse.json({ error: "Missing shop" }, { status: 400 });
    }

    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const usageRef = db.collection("usage_logs").doc(`${shop}_${yearMonth}`);

    const usageSnap = await usageRef.get();
    const usageData = usageSnap.data();
    const usageCount = usageData?.count ?? 0;

    // 仮プラン: Lite
    const limit = 50000;

    return NextResponse.json({
      shop,
      yearMonth,
      usageCount,
      limit,
      overLimit: usageCount > limit,
    });
  } catch (err: any) {
    console.error("usage API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
