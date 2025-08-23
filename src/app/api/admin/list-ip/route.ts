// src/app/api/admin/list-ip/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export async function GET() {
  try {
    const snapshot = await db.collection("ip_blocks").get();
    const blocked: string[] = snapshot.docs.map((doc) => doc.data().ip);

    return NextResponse.json({ ok: true, blocked });
  } catch (error) {
    console.error("Error fetching blocked IPs:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch blocked IPs" },
      { status: 500 }
    );
  }
}
