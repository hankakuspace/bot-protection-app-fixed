import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkIp } from "@/lib/check-ip";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 管理画面と API は常に許可
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // ユーザーIPを取得
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";

  const result = await checkIp(ip);

  if (result.isAdmin) {
    return NextResponse.next();
  }

  if (result.blocked) {
    return NextResponse.rewrite(new URL("/blocked", req.url));
  }

  return NextResponse.next();
}
