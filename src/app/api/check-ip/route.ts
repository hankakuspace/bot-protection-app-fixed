// src/app/api/check-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { getClientIp, isAdminIp, isIpBlocked, isCountryBlocked } from "@/lib/check-ip";
import { isBotUserAgent } from "@/lib/check-useragent";

export const runtime = "nodejs";

async function getCountryCode(ip: string): Promise<string> {
  try {
    const token = process.env.IPINFO_TOKEN;
    if (!token || ip === "UNKNOWN") return "UNKNOWN";

    const res = await fetch(`https://ipinfo.io/${ip}?token=${token}`);
    if (!res.ok) return "UNKNOWN";

    const text = await res.text();
    if (!text) return "UNKNOWN";

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return "UNKNOWN";
    }

    return data.country || "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
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
    let allowedCountry = true;
    if (ip) {
      country = await getCountryCode(ip);
      const blockedCountry = await isCountryBlocked(country);
      allowedCountry = !blockedCountry;
    }

    // ✅ 管理者/ブロック判定
    const isAdmin = await isAdminIp(ip);
    const blocked = await isIpBlocked(ip);

    // ✅ UserAgent & Bot 判定
    const userAgent = req.headers.get("user-agent") || "";
    const isBot = isBotUserAgent(userAgent);

    // ✅ Firestore 保存
    await adminDb.collection("access_logs").add({
      shop,
      ip: String(ip),
      country: String(country),
      allowedCountry,
      blocked,
      isAdmin,
      userAgent,
      isBot, // ← 追加
      createdAt: FieldValue.serverTimestamp(),
      logTimestamp: new Date().toISOString(),
    });

    // ✅ レスポンス
    return NextResponse.json({
      shop,
      requestIp: String(ip),
      country: String(country),
      isAdmin,
      blocked,
      allowedCountry,
      isBot,
      usageCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
