import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIp } from "@/lib/ip-utils"; // ✅ Edge対応だけ

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/favicon.ico" || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (
    process.env.NODE_ENV === "production" &&
    req.headers.get("host") !== "be-search.biz"
  ) {
    return NextResponse.next();
  }

  const ip = await getClientIp(req);

  const res = NextResponse.next();
  res.headers.set("x-client-ip", ip);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
