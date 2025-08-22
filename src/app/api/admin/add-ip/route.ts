import { NextResponse } from "next/server";
import { normalizeIp, normalizeCidr } from "@/lib/ipMatch";
import { listIps, addIp } from "@/lib/ipStore";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    console.log("[API:add-ip] called");
    const body = await req.json().catch(() => ({}));
    console.log("[API:add-ip] body =", body);

    let rule = String(body.ip ?? "").trim();
    if (!rule) {
      return NextResponse.json({ ok: false, error: "ip required" }, { status: 400 });
    }

    rule = rule.includes("/") ? normalizeCidr(rule) : normalizeIp(rule);
    console.log("[API:add-ip] normalized =", rule);

    const cur = await listIps().catch((err) => {
      console.error("[API:add-ip] listIps error:", err);
      throw err;
    });
    console.log("[API:add-ip] current =", cur);

    if (!cur.includes(rule)) {
      await addIp(rule).catch((err) => {
        console.error("[API:add-ip] addIp error:", err);
        throw err;
      });
      return NextResponse.json({ ok: true, added: true, blocked: [...cur, rule] });
    } else {
      return NextResponse.json({ ok: true, added: false, blocked: cur });
    }
  } catch (err) {
    console.error("[API:add-ip] fatal error", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
