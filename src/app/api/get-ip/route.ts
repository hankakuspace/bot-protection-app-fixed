import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // admin SDK
import type { NextRequest } from "next/server";
import requestIp from "request-ip";

export const runtime = "nodejs"; // ← Node.js Runtime で実行

export async function GET(req: NextRequest) {
  const ip = requestIp.getClientIp(req as any) || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  // 仮の国判定（将来 ipinfo.io などに置き換え可能）
  const country = "??";

  const payload = {
    ip,
    country,
    allowedCountry: true,
    blocked: false,
    isAdmin: false,
    userAgent,
    timestamp: new Date(),
  };

  // Firestore書き込みは失敗してもレスポンスには影響させない
  try {
    if (db) {
      await db.collection("access_logs").add(payload); // ← admin SDK の書き方
    }
  } catch (err) {
    console.error("Failed to save access_logs:", err);
  }

  return NextResponse.json(payload, { status: 200 });
}
