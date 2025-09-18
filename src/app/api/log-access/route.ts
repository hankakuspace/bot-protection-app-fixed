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

// ✅ 利用数カウント
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

// ✅ 共通でCORSヘッダーを付与するヘルパー
function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

/**
 * POST
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const shop = body.shop;
    if (!shop) {
      return withCors(
        NextResponse.json({ ok: false, error: "Missing shop parameter" }, { status: 400 })
      );
    }

    const ip = await getClientIp(req);
    const { country, allowed } = await getCountryFromIp(ip);
    const userAgent = body.ua || req.headers.get("user-agent") || "UNKNOWN";

    await incrementUsage(shop);

    const logData = {
      shop,
      ip,
      country,
      allowedCountry: allowed,
      blocked: body.blocked ?? false,
      isAdmin: body.isAdmin ?? false,
      userAgent,
      isBot: isBotUserAgent(userAgent),
      host: body.host || req.headers.get("host") || null,
      url: body.url || null,
      referrer: body.referrer || null,
      clientTime: body.t || null,
      createdAt: new Date(),
      logTimestamp: new Date().toISOString(),
    };

    // ✅ 保存内容をデバッグログ出力
    console.log("🔥 access_log 保存内容:", logData);

    await adminDb.collection("access_logs").add(logData);

    return withCors(NextResponse.json({ ok: true }));
  } catch (err: any) {
    return withCors(NextResponse.json({ ok: false, error: err.message }, { status: 500 }));
  }
}

/**
 * GET
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    if (!shop) {
      return withCors(
        NextResponse.json({ ok: false, error: "Missing shop parameter" }, { status: 400 })
      );
    }

    const ip = await getClientIp(req);
    const { country, allowed } = await getCountryFromIp(ip);
    const userAgent = searchParams.get("ua") || req.headers.get("user-agent") || "UNKNOWN";

    await incrementUsage(shop);

    const logData = {
      shop,
      ip,
      country,
      allowedCountry: allowed,
      blocked: searchParams.get("blocked") === "true",
      isAdmin: searchParams.get("isAdmin") === "true",
      userAgent,
      isBot: isBotUserAgent(userAgent),
      host: req.headers.get("host") || null,
      url: searchParams.get("url") || null,
      referrer: searchParams.get("referrer") || null,
      clientTime: searchParams.get("t") || null,
      createdAt: new Date(),
      logTimestamp: new Date().toISOString(),
    };

    // ✅ 保存内容をデバッグログ出力
    console.log("🔥 access_log 保存内容:", logData);

    await adminDb.collection("access_logs").add(logData);

    return withCors(NextResponse.json({ ok: true, shop, country, allowedCountry: allowed }));
  } catch (err: any) {
    return withCors(NextResponse.json({ ok: false, error: err.message }, { status: 500 }));
  }
}

/**
 * OPTIONS (CORS preflight)
 */
export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
