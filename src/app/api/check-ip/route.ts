// src/app/api/check-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { getClientIp, isAdminIp } from "@/lib/check-ip";
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
        updatedAt: new Date(),
      },
      { merge: true }
    );

    const usageSnap = await usageRef.get();
    const usageData = usageSnap.data();
    const usageCount = usageData?.count ?? 0;

    // ✅ クライアントIP取得
    const ip = await getClientIp(req);

    // ✅ 国コード判定
    let country: string = "UNKNOWN";
    if (ip) {
      country = await getCountryFromIp(ip);
    }

    // ✅ 管理者IP判定
    const isAdmin = ip ? await isAdminIp(String(ip)) : false;

    // ✅ UserAgent 取得
    const userAgent = req.headers.get("user-agent") || "";

    // ✅ 全ヘッダーをデバッグ出力
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.error("🔥 DEBUG HEADERS", headers);

    // ✅ アクセスログ保存
    await adminDb.collection("access_logs").add({
      ip: String(ip),
      country: String(country),
      allowedCountry: true,
      blocked: false,
      isAdmin,
      userAgent,
      headers, // ← 保存して後で確認できるようにする
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      shop,
      ip: String(ip),
      country: String(country),
      blocked: false,
      isAdmin,
      usageCount,
      limit: 50000,
      headers, // ← APIレスポンスにも返す
    });
  } catch (err: any) {
    console.error("check-ip error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
