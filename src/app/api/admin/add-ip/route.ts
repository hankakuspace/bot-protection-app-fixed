// src/app/api/admin/add-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export const runtime = "nodejs"; // ←追加

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ip } = body;

    await db.collection("blocked_ips").doc(ip).set({ ip, createdAt: Date.now() });

    return NextResponse.json({ ok: true, added: ip });
  } catch (error) {
    console.error("Error in add-ip:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
