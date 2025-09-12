// src/app/api/check-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { getClientIp } from "@/lib/check-ip";
import { verifyAppProxySignature } from "@/lib/verifyAppProxy"; // ✅ 復活
import { getCountryFromIp } from "@/lib/ipinfo";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // ✅ Shopify Proxy署名検証（復活）
    const result = verifyAppProxySignature(url, process.env.SHOPIFY_API_SECRET || "");
    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason || "Invalid signature" },
        { status: 401 }
      );
    }

    // ✅ shop を抽出
    const shop = url.searchParams.get("shop");
    if (!shop) {
      return NextResponse.json({ error: "Missing shop" }, { status: 400 });
    }

    // ✅ 利用数カウント更新
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const usageRef = adminDb.collection("usage_logs").doc(`${shop}_${yearMonth}`);

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

    // ✅ 国コード判定 (ipinfo.io)
    let country: any = "UNKNOWN";
    if (ip) {
      // @ts-ignore
      country = await getCountryFromIp(ip);
    }

    // ✅ Firestoreからブロック対象を取得
    const blockedIpsSnap = ip ? await adminDb.collection("blocked_ips").doc(String(ip)).get() : null;
    const blockedCountriesSnap = await adminDb.collection("blocked_countries").doc(String(country)).get();

    const ipBlocked = blockedIpsSnap?.exists ?? false;
    const countryBlocked = blockedCountriesSnap.exists;
    const blocked = ipBlocked || countryBlocked;

    return NextResponse.json({
      shop,
      ip: String(ip),
      country: String(country),
      blocked,
      usageCount,
      limit: 50000, // 仮：Lite プランの上限
    });
  } catch (err: any) {
    console.error("check-ip error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
