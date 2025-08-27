// src/app/api/shopify/proxy/[[...slug]]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/check-ip";
import { db } from "@/lib/firebase";

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
 * Proxyルート
 */
export async function POST(req: NextRequest, { params }: { params: { slug?: string[] } }) {
  const slug = params.slug?.join("/") || "";

  // 🔹 log-access の場合は Firestore に保存
  if (slug === "log-access") {
    try {
      const body = await req.json();
      const ip = getClientIp(req);
      const { country, allowed } = await getCountryFromIp(ip);

      const userAgent = body.ua || req.headers.get("user-agent") || "UNKNOWN";
      const clientTime = body.t || null;

      await db.collection("access_logs").add({
        ip,
        country,
        allowedCountry: allowed,
        blocked: body.blocked ?? false,
        isAdmin: body.isAdmin ?? false,
        userAgent,
        url: body.url || null,
        referrer: body.referrer || null,
        createdAt: new Date(),
        clientTime,
      });

      return NextResponse.json({ ok: true });
    } catch (err: any) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
  }

  // 🔹 それ以外は通常の proxy 応答
  return NextResponse.json({
    ok: true,
    route: "proxy",
    slug,
  });
}

/**
 * GET リクエスト用（動作確認など）
 */
export async function GET(req: NextRequest, { params }: { params: { slug?: string[] } }) {
  const slug = params.slug?.join("/") || "";
  return NextResponse.json({
    ok: true,
    method: "GET",
    route: "proxy",
    slug,
  });
}
