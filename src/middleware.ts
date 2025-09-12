// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIp } from "@/lib/check-ip";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🚫 favicon は除外
  if (pathname === "/favicon.ico") return NextResponse.next();

  // 🚫 API 完全除外（OAuth含む）
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // 🚫 host チェックは本番のみ
  if (
    process.env.NODE_ENV === "production" &&
    req.headers.get("host") !== "be-search.biz"
  ) {
    return NextResponse.next();
  }

  // ✅ クライアントIP取得のみ（Firestore参照は不可：Edge Runtime制約）
  const ip = await getClientIp(req);

  // 👉 将来的に API を叩いてブロック判定する仕組みに差し替える予定
  const res = NextResponse.next();
  res.headers.set("x-client-ip", ip);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
