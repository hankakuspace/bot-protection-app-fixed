// src/app/api/log-access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

// ipinfo.io を使って国コードを取得する関数
async function getCountryFromIp(ip: string): Promise<string> {
  if (!ip || ip === "unknown") return "UNKNOWN";

  try {
    const token = process.env.IPINFO_TOKEN;
    const resp = await fetch(`https://ipinfo.io/${ip}/json?token=${token}`);
    if (!resp.ok) return "UNKNOWN";

    const data = await resp.json();
    return data.country || "UNKNOWN";
  } catch (e) {
    console.error("IP lookup failed:", e);
    return "UNKNOWN";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ip, isAdmin } = await req.json();

    // ✅ User-Agent を取得
    const userAgent = req.headers.get("user-agent") || "UNKNOWN";

    // ✅ favicon / screenshot 系はログ保存しない
    if (
      userAgent.includes("vercel-favicon") ||
      userAgent.includes("vercel-screenshot")
    ) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // ✅ 国判定 (ipinfo.io)
    const country = await getCountryFromIp(ip);

    // ✅ 許可国かどうか（例: 日本のみ許可）
    const allowedCountry = country === "JP";

    // ✅ ブロック判定
    const blocked = !allowedCountry;

    // ✅ Firestore に保存
    await db.collection("access_logs").add({
      ip: ip || "UNKNOWN",
      country,
      allowedCountry,
      blocked,
      isAdmin: !!isAdmin,
      userAgent,
      timestamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      ip,
      country,
      allowedCountry,
      blocked,
      isAdmin,
      userAgent,
    });
  } catch (err) {
    console.error("log-access error:", err);
    return NextResponse.json(
      { ok: false, error: "failed to log access" },
      { status: 500 }
    );
  }
}
