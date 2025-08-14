import { NextResponse } from "next/server";
import { normalizeIp, normalizeCidr } from "@/lib/ipMatch";
import { listIps, setIps } from "@/lib/ipStore"; // ← 既存ストアを使用（setIps が無い場合は後述の例を導入）

export async function GET() {
  const blocked = await listIps();
  return NextResponse.json({ ok: true, blocked });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  let rule = String(body.ip ?? "").trim();
  if (!rule) return NextResponse.json({ ok: false, error: "ip required" }, { status: 400 });

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

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  let rule = String(body.ip ?? "").trim();
  if (!rule) return NextResponse.json({ ok: false, error: "ip required" }, { status: 400 });

  try {
    rule = rule.includes("/") ? normalizeCidr(rule) : normalizeIp(rule);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid ip/cidr" }, { status: 400 });
  }

  const cur = await listIps();
  const next = cur.filter(r => r !== rule);
  const removed = next.length !== cur.length;
  if (removed) await setIps(next);

  return NextResponse.json({ ok: true, removed, blocked: next });
}
