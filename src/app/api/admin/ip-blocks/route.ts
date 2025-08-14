import { NextRequest, NextResponse } from "next/server";
import { listIps, addIp, removeIp } from "../../../../lib/ipStore";

const ADMIN_KEY = process.env.ADMIN_DASH_KEY || ""; // ダッシュ用の簡易キー

function auth(req: NextRequest) {
  if (!ADMIN_KEY) return true; // キー未設定ならオープン（開発用）
  const key = req.headers.get("x-admin-key") || "";
  return key === ADMIN_KEY;
}

// GET: 一覧 / POST: 追加 { ip } / DELETE: 削除 { ip }
export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const blocked = await listIps();
  return NextResponse.json({ ok: true, blocked });
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { ip } = (await req.json().catch(() => ({}))) as { ip?: string };
  if (!ip) return NextResponse.json({ ok: false, error: "ip required" }, { status: 400 });
  const r = await addIp(ip);
  return NextResponse.json({ ok: true, ...r });
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { ip } = (await req.json().catch(() => ({}))) as { ip?: string };
  if (!ip) return NextResponse.json({ ok: false, error: "ip required" }, { status: 400 });
  const r = await removeIp(ip);
  return NextResponse.json({ ok: true, ...r });
}
