// src/app/api/admin/block-ip/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import admin from "firebase-admin";
import * as ipaddr from "ipaddr.js";

export const runtime = "nodejs";

// ✅ IPをCIDR表記に統一する関数
function toCidr(ip: string): string {
  try {
    if (!ipaddr.isValid(ip)) return ip;
    const parsed = ipaddr.parse(ip);

    if (parsed.kind() === "ipv6") {
      // IPv6は /64
      const parts = parsed.toNormalizedString().split(":");
      const prefix = parts.slice(0, 4).join(":");
      return `${prefix}::/64`;
    } else {
      // IPv4は /32
      return `${parsed.toString()}/32`;
    }
  } catch {
    return ip;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ip, note } = await req.json();
    if (!ip) {
      return NextResponse.json({ error: "Missing IP" }, { status: 400 });
    }

    // ✅ 保存形式に正規化
    const cidrIp = toCidr(ip);

    // ✅ 重複登録チェック
    const dupSnap = await adminDb
      .collection("blocked_ips")
      .where("ip", "==", cidrIp)
      .get();

    if (!dupSnap.empty) {
      return NextResponse.json(
        { error: "このIPはすでにブロック登録されています" },
        { status: 400 }
      );
    }

    // ✅ 管理者IPとの競合チェック（管理者IPもCIDRに揃える）
    const adminSnap = await adminDb.collection("admin_ips").get();
    const adminIps = adminSnap.docs.map((doc) => toCidr(doc.data().ip));

    if (adminIps.includes(cidrIp)) {
      return NextResponse.json(
        { error: "管理者IPはブロックIPに登録できません" },
        { status: 400 }
      );
    }

    // ✅ Firestore に保存（必ずCIDR表記で）
    await adminDb.collection("blocked_ips").add({
      ip: cidrIp,
      note: note || "",
      blocked: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, ip: cidrIp });
  } catch (err: any) {
    console.error("block-ip/add error:", err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
