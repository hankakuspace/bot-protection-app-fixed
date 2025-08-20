import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkIp } from "@/lib/check-ip";

export async function middleware(req: NextRequest) {
  // 管理画面は常に許可
  if (req.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // IPアドレスを取得（Vercel では x-forwarded-for から取る）
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";

  // 判定ロジック
  const result = await checkIp(ip);

  if (result.isAdmin) {
    return NextResponse.next(); // 管理者は常に許可
  }

  if (result.blocked) {
    return NextResponse.rewrite(new URL("/blocked", req.url));
  }

  return NextResponse.next();
}
