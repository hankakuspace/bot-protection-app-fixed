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
export async function POST(req: NextRequest, context: any) {
  const slug = context.params?.slug?.join("/") || "";

  if (slug === "log-access") {
    try {
      const body = await req.json();
      const ip = await getClientIp(req);
      const { country, allowed } = await getCountryFromIp(ip);

      const userAgent = body.ua || req.headers.get("user-agent") || "UNKNOWN";
      const clientTime = body.t || null;

      // ✅ 管理者判定を isAdminIp() で行う
      const isAdmin = await isAdminIp(ip);

      await adminDb.collection("access_logs").add({
        ip,
        country,
        allowedCountry: allowed,
        blocked: body.blocked ?? false,
        isAdmin,   // ← 判定済みの値を保存
        userAgent,
        url: body.url || null,
        host: body.host || req.headers.get("host"),
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
 * GET: /apps/.../check-ip → 内部APIにフォワード
 */
export async function GET(req: NextRequest, context: any) {
  const slug = context.params?.slug?.join("/") || "";

  if (slug === "check-ip") {
    const targetUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/api/check-ip`);
    req.nextUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });

    const res = await fetch(targetUrl.toString(), {
      headers: req.headers,
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data);
  }

  return NextResponse.json({
    ok: true,
    method: "GET",
    route: "proxy",
    slug,
  });
}
