// src/app/api/check-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { getClientIp, isAdminIp } from "@/lib/check-ip";
import { getCountryFromIp } from "@/lib/ipinfo";
import admin from "firebase-admin";

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
    const ip = getClientIp(req);

    // ✅ 国コード判定
    let country: string = "UNKNOWN";
    if (ip) {
      country = await getCountryFromIp(ip);
    }

    // ✅ Firestoreから管理者IPリストを取得
    const snapshot = await adminDb.collection("admin_ips").get();
    const adminIps = snapshot.docs.map((doc) => doc.data().ip);

    // ✅ 管理者IP判定
    const isAdmin = await isAdminIp(ip);

    // ✅ UserAgent 取得
    const userAgent = req.headers.get("user-agent") || "";

    // ✅ アクセスログ保存 (Timestampを使用)
    await adminDb.collection("access_logs").add({
      ip: String(ip),
      country: String(country),
      allowedCountry: true,
      blocked: false,
      isAdmin,
      userAgent,
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // ✅ Timestamp
    });

    // ✅ レスポンス
    return NextResponse.json({
      shop,
      requestIp: String(ip),
      country: String(country),
      isAdmin,
      usageCount,
      adminIps,
    });
  } catch (err: any) {
    console.error("check-ip error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
