import { NextResponse } from "next/server";
import { normalizeIp, normalizeCidr } from "@/lib/ipMatch";
import { listIps, setIps } from "@/lib/ipStore";

export const runtime = "nodejs";

export async function DELETE(req: Request) {
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
  const next = cur.filter((r) => r !== rule);
  const removed = next.length !== cur.length;
  if (removed) await setIps(next);

  return NextResponse.json({ ok: true, removed, blocked: next });
}
