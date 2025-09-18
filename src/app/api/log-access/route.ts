// src/app/api/log-access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { getClientIp } from "@/lib/check-ip";
import { isBotUserAgent } from "@/lib/check-useragent";

export const runtime = "nodejs";

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

// ✅ 利用数カウント用関数
async function incrementUsage(shop: string) {
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
}

/**
 * POST
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ip = await getClientIp(req);
    const { country, allowed } = await getCountryFromIp(ip);
    const userAgent = body.userAgent || req.headers.get("user-agent") || "UNKNOWN";
    const shop = body.shop || "ruhra-store.myshopify.com";

    // ✅ 利用数カウント
    await incrementUsage(shop);

    // ✅ アクセスログ保存
    await adminDb.collection("access_logs").add({
      shop,
      ip,
      country,
      allowedCountry: allowed,
      blocked: body.blocked ?? false,
      isAdmin: body.isAdmin ?? false,
      userAgent,
      isBot: isBotUserAgent(userAgent),
      host: req.headers.get("host") || null,
      createdAt: new Date(),
      logTimestamp: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * GET
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ip = await getClientIp(req);
    const { country, allowed } = await getCountryFromIp(ip);
    const userAgent = searchParams.get("ua") || req.headers.get("user-agent") || "UNKNOWN";
    const shop = searchParams.get("shop") || "ruhra-store.myshopify.com";

    // ✅ 利用数カウント
    await incrementUsage(shop);

    // ✅ アクセスログ保存
    await adminDb.collection("access_logs").add({
      shop,
      ip,
      country,
      allowedCountry: allowed,
      blocked: searchParams.get("blocked") === "true",
      isAdmin: searchParams.get("isAdmin") === "true",
      userAgent,
      isBot: isBotUserAgent(userAgent),
      host: req.headers.get("host") || null,
      createdAt: new Date(),
      logTimestamp: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, shop, country, allowedCountry: allowed });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
