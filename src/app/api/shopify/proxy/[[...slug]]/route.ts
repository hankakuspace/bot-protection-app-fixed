// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isAdminIp, isIpBlocked, isCountryBlocked } from "@/lib/check-ip";
import { adminDb } from "@/lib/firebase";

export const runtime = "nodejs";

/**
 * IPから国情報を取得
 * Firestore の blocked_countries を参照して allowed 判定する
 */
async function getCountryFromIp(ip: string): Promise<{ country: string; allowed: boolean }> {
  try {
    const token = process.env.IPINFO_TOKEN;
    if (!token || ip === "UNKNOWN") return { country: "UNKNOWN", allowed: true }; // ← デフォルトは true

    const res = await fetch(`https://ipinfo.io/${ip}?token=${token}`);
    if (!res.ok) return { country: "UNKNOWN", allowed: true };

    const data = await res.json();
    const country = data.country || "UNKNOWN";

    // ✅ Firestore の blocked_countries を参照
    const blocked = await isCountryBlocked(country);
    return { country, allowed: !blocked };
  } catch (err) {
    console.error("getCountryFromIp error:", err);
    return { country: "UNKNOWN", allowed: true };
  }
}

/**
 * POST: /apps/.../log-access → Firestore保存
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const ip = getClientIp(req);

    // ✅ 管理者IP判定
    const isAdmin = await isAdminIp(ip);

    // ✅ IPブロック判定
    const blocked = await isIpBlocked(ip);

    // ✅ 国コード判定（Firestoreの blocked_countries を参照）
    const { country, allowed } = await getCountryFromIp(ip);

    // ✅ 保存前のデータをオブジェクト化
    const writtenLog = {
      ip,
      country,
      allowedCountry: allowed,
      blocked,
      isAdmin,
      userAgent: req.headers.get("user-agent") || null,
      url: body.url || null,
      host: body.host || req.headers.get("host"),
      referrer: body.referrer || null,
      createdAt: new Date(),
      logTimestamp: new Date().toISOString(),
    };

    // Firestore に保存
    const ref = await adminDb.collection("access_logs").add(writtenLog);
    const saved = await ref.get();

    console.log("🔥 DEBUG proxy log-access 保存比較", {
      written: writtenLog,
      saved: saved.data(),
    });

    return NextResponse.json({ ok: true, id: ref.id });
  } catch (error) {
    console.error("❌ log-access 保存エラー", error);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}
