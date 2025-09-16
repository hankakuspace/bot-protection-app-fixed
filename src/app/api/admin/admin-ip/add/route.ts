// src/app/api/admin/admin-ip/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import admin from "firebase-admin";

export const runtime = "nodejs";

// ✅ IPv6を/64プレフィックスに正規化する関数
function normalizeIp(ip: string): string {
  if (!ip) return ip;
  if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", ""); // IPv4-mapped IPv6

  if (ip.includes(":")) {
    // IPv6 → /64 プレフィックスで保存
    return ip.split(":").slice(0, 4).join(":") + "::/64";
  }
  return ip; // IPv4はそのまま
}

export async function POST(req: NextRequest) {
  try {
    const { ip, note } = await req.json();
    if (!ip) {
      return NextResponse.json({ error: "Missing IP" }, { status: 400 });
    }

    const normalizedIp = normalizeIp(ip);

    await adminDb.collection("admin_ips").doc(normalizedIp).set({
      ip: normalizedIp,
      note: note || "",
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, ip: normalizedIp });
  } catch (err: any) {
    console.error("add-admin-ip error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
