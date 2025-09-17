// src/app/api/check-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { getClientIp, isAdminIp, isIpBlocked, isCountryBlocked } from "@/lib/check-ip";
import { isBotUserAgent } from "@/lib/check-useragent";

export const runtime = "nodejs";

// ✅ IPinfo を使って国コードを取得する関数
async function getCountryCode(ip: string): Promise<string> {
  try {
    const token = process.env.IPINFO_TOKEN;
    if (!token || ip === "UNKNOWN") {
      console.warn("⚠️ IPINFO_TOKEN 未設定 or IP=UNKNOWN");
      return "UNKNOWN";
    }

    const res = await fetch(`https://ipinfo.io/${ip}?token=${token}`);
    if (!res.ok) {
      console.error("❌ ipinfo.io API error", { ip, status: res.status });
      return "UNKNOWN";
    }

    const text = await res.text();
    if (!text) {
      console.error("❌ ipinfo.io empty response", { ip });
      return "UNKNOWN";
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("❌ ipinfo.io JSON parse error", { ip, text });
      return "UNKNOWN";
    }

    return data.country || "UNKNOWN";
  } catch (err) {
    console.error("getCountryCode fatal error:", err);
    return "UNKNOWN";
  }
}

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

    // ✅ 国コード判定 + ブロックチェック
    let country: string = "UNKNOWN";
    let allowedCountry = true;
    let blockedCountry = false;
    if (ip) {
      country = await getCountryCode(ip);
      blockedCountry = await isCountryBlocked(country);
      allowedCountry = !blockedCountry;
    }

    // ✅ 管理者IP判定
    const isAdmin = await isAdminIp(ip);

    // ✅ ブロックIP判定
    const blocked = await isIpBlocked(ip);

    // ✅ UserAgent & Bot 判定
    const userAgent = req.headers.get("user-agent") || "";
    const isBot = isBotUserAgent(userAgent);

    // ✅ Firestore に保存
    const ref = await adminDb.collection("access_logs").add({
      shop,
      ip: String(ip),
      country: String(country),
      allowedCountry,
      blocked, // ← IP/Country のみで判定。Bot はブロック対象外（SEO 対策）
      isAdmin,
      userAgent,
      isBot, // ← 保存
      createdAt: FieldValue.serverTimestamp(),
      logTimestamp: new Date().toISOString(),
    });

    const saved = await ref.get();
    console.log("🔥 DEBUG Firestore 保存直後", saved.data());

    // ✅ レスポンス
    return NextResponse.json({
      shop,
      requestIp: String(ip),
      country: String(country),
      isAdmin,
      blocked,
      allowedCountry,
      isBot, // ← レスポンスにも追加
      usageCount,
    });
  } catch (err: any) {
    console.error("check-ip error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
s