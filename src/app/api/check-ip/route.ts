// src/app/api/check-ip/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export const runtime = "nodejs"; // EdgeではなくNode.jsランタイムで実行

export async function POST(req: Request) {
  try {
    const { ip } = await req.json();
    if (!ip) return NextResponse.json({ blocked: false });

    const doc = await db.collection("blocked_ips").doc(ip).get();
    return NextResponse.json({ blocked: doc.exists });
  } catch (err: any) {
    console.error("Error in check-ip:", err);
    return NextResponse.json({ blocked: false, error: err.message }, { status: 500 });
  }
}
