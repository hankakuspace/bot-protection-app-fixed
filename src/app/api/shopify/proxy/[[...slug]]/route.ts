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
 * POST: /apps/.../log-access → Firestore保存
 */
export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug?.join("/") || "";

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

  return NextResponse.json({
    ok: true,
    route: "proxy",
    slug,
  });
}

/**
 * GET: 確認用
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug?.join("/") || "";
  return NextResponse.json({
    ok: true,
    method: "GET",
    route: "proxy",
    slug,
  });
}
