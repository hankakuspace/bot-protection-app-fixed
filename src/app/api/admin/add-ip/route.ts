import { NextResponse } from "next/server";
import { normalizeIp, normalizeCidr } from "@/lib/ipMatch";
import { listIps, setIps } from "@/lib/ipStore";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  let rule = String(body.ip ?? "").trim();
  if (!rule) {
    return NextResponse.json({ ok: false, error: "ip required" }, { status: 400 });
  }

  try {
    rule = rule.includes("/") ? normalizeCidr(rule) : normalizeIp(rule);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid ip/cidr" }, { status: 400 });
  }

  const cur = await listIps();
  if (!cur.includes(rule)) {
    cur.push(rule);
    await setIps(cur);
    return NextResponse.json({ ok: true, added: true, blocked: cur });
  } else {
    return NextResponse.json({ ok: true, added: false, blocked: cur });
  }
}
