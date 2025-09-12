// src/app/api/check-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { getClientIp } from "@/lib/check-ip";
import { verifyProxySignature } from "@/lib/verify-proxy"; // 署名検証ユーティリティ（既存を利用）

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // ✅ Shopify Proxy署名検証
    const valid = verifyProxySignature(searchParams);
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // ✅ shop を抽出
    const shop = searchParams.get("shop");
    if (!shop) {
      return NextResponse.json({ error: "Missing shop" }, { status: 400 });
    }

    // ✅ 利用数カウント更新
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const usageRef = db.collection("usage_logs").doc(`${shop}_${yearMonth}`);

    await usageRef.set(
      {
        shop,
        yearMonth,
        count: FieldValue.increment(1),
        updatedAt: new Date(),
      },
      { merge: true }
    );

    const usageSnap = await usageRef.get();
    const usageData = usageSnap.data();
    const usageCount = usageData?.count ?? 0;

    // ✅ クライアントIP取得
    const ip = getClientIp(req);

    // ✅ ブロック判定（既存ロジックをここに統合する）
    // 今はダミーで false、本来は Firestore の blocked_ips / block_countries を参照
    const blocked = false;

    return NextResponse.json({
      shop,
      ip,
      blocked,
      usageCount,
      limit: 50000, // 仮：Lite プランの上限
    });
  } catch (err: any) {
    console.error("check-ip error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
