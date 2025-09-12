// src/app/api/check-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { getClientIp } from "@/lib/check-ip";
import { verifyAppProxySignature } from "@/lib/verifyAppProxy";
import { getCountryFromIp } from "@/lib/ipinfo";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const result = verifyAppProxySignature(url, process.env.SHOPIFY_API_SECRET || "");
    if (!result.ok) {
      return NextResponse.json({ error: result.reason || "Invalid signature" }, { status: 401 });
    }

    const shop = url.searchParams.get("shop");
    if (!shop) {
      return NextResponse.json({ error: "Missing shop" }, { status: 400 });
    }

    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const usageRef = db.collection("usage_logs").doc(`${shop}_${yearMonth}`);

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

    const ip = getClientIp(req);

    // ✅ 国コード判定 (ipinfo.io) → Promise を二重解決
    let country = "UNKNOWN";
    if (ip) {
      const raw: any = await Promise.resolve(getCountryFromIp(ip));
      country = String(await raw);
    }

    const blockedIpsSnap = ip ? await db.collection("blocked_ips").doc(ip).get() : null;
    const blockedCountriesSnap = await db.collection("blocked_countries").doc(country).get();

    const ipBlocked = blockedIpsSnap?.exists ?? false;
    const countryBlocked = blockedCountriesSnap.exists;
    const blocked = ipBlocked || countryBlocked;

    return NextResponse.json({
      shop,
      ip,
      country,
      blocked,
      usageCount,
      limit: 50000,
    });
  } catch (err: any) {
    console.error("check-ip error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
