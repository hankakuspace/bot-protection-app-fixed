import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // ← admin SDK
export const runtime = "nodejs";     // ← サーバーで動かす

const COLL = "blocked_ips";

export async function GET() {
  try {
    const snap = await db.collection(COLL).get();  // admin SDK の書き方
    const ips = snap.docs.map(d => ({ ip: d.id, ...(d.data() as any) }));
    return NextResponse.json({ ips });
  } catch (err: any) {
    console.error("Error in blacklist API:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
