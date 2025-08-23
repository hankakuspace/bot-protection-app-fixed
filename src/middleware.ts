// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "unknown";

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/check-ip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip }),
    });
    const data = await res.json();

    if (data.blocked) {
      return new NextResponse("Access denied: your IP is blocked.", { status: 403 });
    }
  } catch (err) {
    console.error("Middleware error:", err);
  }

  return NextResponse.next();
}
