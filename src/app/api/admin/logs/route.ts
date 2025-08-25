// src/app/api/admin/logs/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export const runtime = "nodejs"; // ←追加

export async function GET() {
  try {
    const snapshot = await db.collection("access_logs").orderBy("timestamp", "desc").limit(100).get();
    const logs = snapshot.docs.map((doc) => doc.data());

    return NextResponse.json({ ok: true, logs });
  } catch (error) {
    console.error("Error in logs:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
