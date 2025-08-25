// src/app/api/admin/delete-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export const runtime = "nodejs"; // ←追加

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ip } = body;

    await db.collection("blocked_ips").doc(ip).delete();

    return NextResponse.json({ ok: true, deleted: ip });
  } catch (error) {
    console.error("Error in delete-ip:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
