// src/app/api/admin/list-ip/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await adminDb.collection("blocked_ips").get();
    const ips = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ ok: true, ips });
  } catch (err: any) {
    console.error("list-ip error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
