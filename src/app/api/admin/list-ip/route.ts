import { NextResponse } from "next/server";
import { listIps } from "@/lib/ipStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    console.log("[list-ip] API called"); // デバッグログ
    const blocked = await listIps();
    console.log("[list-ip] blocked =", blocked); // デバッグログ
    return NextResponse.json({ ok: true, blocked });
  } catch (err) {
    console.error("[list-ip] error", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
