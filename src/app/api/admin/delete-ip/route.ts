import { NextResponse } from "next/server";
import { normalizeIp, normalizeCidr } from "@/lib/ipMatch";
import { listIps, setIps } from "@/lib/ipStore";

export const runtime = "nodejs";

export async function DELETE(req: Request) {
  try {
    console.log("[delete-ip] API called");
    const body = await req.json().catch(() => ({}));
    console.log("[delete-ip] body =", body);

    let rule = String(body.ip ?? "").trim();
    if (!rule) {
      return NextResponse.json({ ok: false, error: "ip required" }, { status: 400 });
    }

    rule = rule.includes("/") ? normalizeCidr(rule) : normalizeIp(rule);

    const cur = await listIps();
    const next = cur.filter((r) => r !== rule);
    const removed = next.length !== cur.length;

    if (removed) {
      await setIps(next);
      console.log("[delete-ip] removed =", rule);
    }

    return NextResponse.json({ ok: true, removed, blocked: next });
  } catch (err) {
    console.error("[delete-ip] error", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
