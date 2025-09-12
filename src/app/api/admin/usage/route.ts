// src/app/api/admin/usage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    if (!shop) {
      return NextResponse.json({ error: "Missing shop" }, { status: 400 });
    }

    // ✅ プラン情報を Firestore から取得
    const shopDoc = await adminDb.collection("shops").doc(shop).get();
    const plan = shopDoc.exists ? shopDoc.data()?.plan || "Lite" : "Lite";

    // ✅ プランごとの上限
    let limit: number | null = null;
    if (plan === "Lite") limit = 50000;
    if (plan === "Pro") limit = 250000;
    if (plan === "Enterprise") limit = null; // 無制限

    // ✅ 当月利用数を取得
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const usageRef = adminDb.collection("usage_logs").doc(`${shop}_${yearMonth}`);
    const usageSnap = await usageRef.get();
    const usageData = usageSnap.data();
    const usageCount = usageData?.count ?? 0;

    // ✅ 上限超過判定
    const overLimit = limit !== null ? usageCount > limit : false;

    return NextResponse.json({
      shop,
      plan,
      yearMonth,
      usageCount,
      limit: limit ?? "unlimited",
      overLimit,
    });
  } catch (err: any) {
    console.error("usage API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
