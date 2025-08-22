import { NextResponse } from "next/server";
import adminDb from "@/lib/firebase-admin"; // ← default import に修正


export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await adminDb.collection("blocked_ips").get();
    const blocked = snapshot.docs.map((doc) => doc.id);

    return NextResponse.json({ ok: true, blocked });
  } catch (err) {
    console.error("[API:list-ip] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
