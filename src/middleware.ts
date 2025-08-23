import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import requestIp from "request-ip";

export async function middleware(req: NextRequest) {
  // API や静的ファイルは除外
  if (req.nextUrl.pathname.startsWith("/api/") || req.nextUrl.pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  const ip =
    requestIp.getClientIp(req as any) ??
    req.headers.get("x-forwarded-for") ??
    "unknown";

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/check-ip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip }),
    });

    const data = await res.json();

    if (data.blocked) {
      return new NextResponse("Access denied: your IP is blocked.", {
        status: 403,
      });
    }
  } catch (err) {
    console.error("Middleware error:", err);
  }

  return NextResponse.next();
}

// matcher を明確化
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
