// src/app/api/log-access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { getClientIp } from "@/lib/check-ip";

export const runtime = "nodejs";

const ipv4Regex =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

async function getCountryFromIp(ip: string): Promise<string> {
  if (!ip || ip === "UNKNOWN") return "UNKNOWN";
  try {
    const token = process.env.IPINFO_TOKEN;
    const resp = await fetch(`https://ipinfo.io/${ip}/json?token=${token}`);
    if (!resp.ok) return "UNKNOWN";
    const data = await resp.json();
    return data.country || "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ip: clientIpFromBody, isAdmin, userAgent, clientTime } = await req.json();

    // ✅ host を取得
    const host = req.headers.get("host") || "";

    // 🚫 本番環境では be-search.biz 以外はログ拒否
    if (process.env.NODE_ENV === "production" && host !== "be-search.biz") {
      return NextResponse.json(
        { ok: false, error: "invalid host", host },
        { status: 400 }
      );
    }

    // ✅ サーバー側を優先、クライアント送信は補助
    let clientIp = getClientIp(req) || clientIpFromBody || "UNKNOWN";

    let ip_v4 = "UNKNOWN";
    let ip_v6 = "UNKNOWN";

    if (clientIp !== "UNKNOWN") {
      if (clientIp.startsWith("::ffff:")) {
        ip_v4 = clientIp.replace("::ffff:", "");
      } else if (ipv4Regex.test(clientIp)) {
        ip_v4 = clientIp;
      } else if (clientIp.includes(":")) {
        ip_v6 = clientIp;
      }
    }

    const ip = ip_v4 !== "UNKNOWN" ? ip_v4 : ip_v6;
    const country = await getCountryFromIp(ip);
    const allowedCountry = country === "JP";
    const blocked = !allowedCountry;

    await db.collection("access_logs").add({
      ip,
      ip_v4,
      ip_v6,
      country,
      allowedCountry,
      blocked,
      isAdmin: !!isAdmin,
      userAgent: userAgent || req.headers.get("user-agent") || "UNKNOWN",
      host, // ✅ 保存
      createdAt: FieldValue.serverTimestamp(),
      clientTime: clientTime || new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      ip,
      ip_v4,
      ip_v6,
      country,
      allowedCountry,
      blocked,
      isAdmin,
      host, // ✅ レスポンスにも含める
    });
  } catch (err) {
    console.error("log-access error:", err);
    return NextResponse.json(
      { ok: false, error: "failed to log access" },
      { status: 500 }
    );
  }
}
