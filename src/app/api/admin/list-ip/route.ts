// src/app/api/admin/list-ip/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";

export const runtime = "nodejs"; // ←追加

export async function GET() {
  try {
    const snapshot = await db.collection("blocked_ips").get();
    const ips = snapshot.docs.map((doc) => doc.data().ip);

    return NextResponse.json({ ok: true, ips });
  } catch (error) {
    console.error("Error in list-ip:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
