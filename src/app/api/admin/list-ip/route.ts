import { NextResponse } from "next/server";
import { listIps } from "@/lib/ipStore";

export const runtime = "nodejs";

export async function GET() {
  const blocked = await listIps();
  return NextResponse.json({ ok: true, blocked });
}
