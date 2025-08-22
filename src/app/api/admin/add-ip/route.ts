import { NextResponse } from "next/server";
import { normalizeIp, normalizeCidr } from "@/lib/ipMatch";
import { listIps, addIp } from "@/lib/ipStore";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let rule = String(body.ip ?? "").trim();
    if (!rule) {
      return NextResponse.json({ ok: false, error: "ip required" }, { status: 400 });
    }

    rule = rule.includes("/") ? normalizeCidr(rule) : normalizeIp(rule);

    const cur = await listIps();
    if (!cur.includes(rule)) {
      await addIp(rule);
      return NextResponse.json({ ok: true, added: true, blocked: [...cur, rule] });
    } else {
      return NextResponse.json({ ok: true, added: false, blocked: cur });
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
