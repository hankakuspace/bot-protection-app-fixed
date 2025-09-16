// src/app/api/check-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { getClientIp, isAdminIp, isIpBlocked } from "@/lib/check-ip";
import { getCountryFromIp } from "@/lib/ipinfo";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // ✅ shop を抽出
    const shop = url.searchParams.get("shop");
    if (!shop) {
      return NextResponse.json({ error: "Missing shop" }, { status: 400 });
    }

    // ✅ 利用数カウント更新
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    const usageRef = adminDb
      .collection("usage_logs")
      .doc(`${shop}_${yearMonth}`);

    await usageRef.set(
      {
        shop,
        yearMonth,
        count: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const usageSnap = await usageRef.get();
    const usageData = usageSnap.data();
    const usageCount = usageData?.count ?? 0;

    // ✅ クライアントIP取得
    const ip = getClientIp(req);

    // ✅ 国コード判定
    let country: string = "UNKNOWN";
    if (ip) {
      country = await getCountryFromIp(ip);
    }

    // ✅ 管理者IP判定
    const isAdmin = await isAdminIp(ip);

    // ✅ ブロックIP判定（CIDR対応）
    const blocked = await isIpBlocked(ip);

    // ✅ UserAgent 取得
    const userAgent = req.headers.get("user-agent") || "";

    // ✅ Firestore に保存
    const ref = await adminDb.collection("access_logs").add({
      shop,
      ip: String(ip),
      country: String(country),
      allowedCountry: true,
      blocked, // ← CIDR対応の結果を保存
      isAdmin,
      userAgent,
      createdAt: FieldValue.serverTimestamp(),
      logTimestamp: new Date().toISOString(),
    });

    // ✅ 保存直後のドキュメントを読み込み
    const saved = await ref.get();
    console.log("🔥 DEBUG Firestore 保存直後", saved.data());

    // ✅ レスポンス
    return NextResponse.json({
      shop,
      requestIp: String(ip),
      country: String(country),
      isAdmin,
      blocked,
      usageCount,
    });
  } catch (err: any) {
    console.error("check-ip error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
