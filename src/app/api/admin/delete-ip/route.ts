import { NextResponse } from "next/server";
import { normalizeIp, normalizeCidr } from "@/lib/ipMatch";
import { listIps, removeIp } from "@/lib/ipStore";

export const runtime = "nodejs";

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let rule = String(body.ip ?? "").trim();
    if (!rule) {
      return NextResponse.json({ ok: false, error: "ip required" }, { status: 400 });
    }

    rule = rule.includes("/") ? normalizeCidr(rule) : normalizeIp(rule);

    const cur = await listIps();
    if (cur.includes(rule)) {
      await removeIp(rule);
      const next = cur.filter((r) => r !== rule);
      return NextResponse.json({ ok: true, removed: true, blocked: next });
    } else {
      return NextResponse.json({ ok: true, removed: false, blocked: cur });
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
