// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isAdminIp } from "@/lib/check-ip";
import { adminDb } from "@/lib/firebase";

export const runtime = "nodejs";

/**
 * IPから国情報を取得
 */
async function getCountryFromIp(ip: string): Promise<{ country: string; allowed: boolean }> {
  try {
    const token = process.env.IPINFO_TOKEN;
    if (!token || ip === "UNKNOWN") return { country: "UNKNOWN", allowed: false };

    const res = await fetch(`https://ipinfo.io/${ip}?token=${token}`);
    if (!res.ok) return { country: "UNKNOWN", allowed: false };

    const data = await res.json();
    const country = data.country || "UNKNOWN";
    return { country, allowed: country === "JP" };
  } catch {
    return { country: "UNKNOWN", allowed: false };
  }
}

/**
 * POST: /apps/.../log-access → Firestore保存
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const ip = getClientIp(req);
    const isAdmin = !!isAdminIp(ip); // ✅ boolean化してFirestoreに保存可能にする
    const { country, allowed } = await getCountryFromIp(ip);

    // ✅ 保存前のデータをオブジェクト化
    const writtenLog = {
      ip,
      country,
      allowedCountry: allowed,
      blocked: body.blocked ?? false,
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

    // 保存直後のデータを取得
    const saved = await ref.get();

    // 🔥 書き込み比較ログ
    console.log("🔥 DEBUG proxy log-access 保存比較", {
      written: writtenLog,
      saved: saved.data(),
    });
    console.log("🔥 Firestore saved raw JSON", JSON.stringify(saved.data(), null, 2));

    return NextResponse.json({ ok: true, id: ref.id });
  } catch (error) {
    console.error("❌ log-access 保存エラー", error);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}
