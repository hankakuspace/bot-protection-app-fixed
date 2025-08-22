import { NextResponse } from "next/server";
import { listIps } from "@/lib/ipStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    const blocked = await listIps();
    return NextResponse.json({ ok: true, blocked });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
