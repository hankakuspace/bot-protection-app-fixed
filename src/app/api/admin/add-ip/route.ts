// src/app/api/admin/add-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeIp(raw: string): string {
  return raw.trim().replace(/^::ffff:/, "");
}

function isValidIpv4(ip: string): boolean {
  const parts = ip.split(".");

  if (parts.length !== 4) {
    return false;
  }

  return parts.every((part) => {
    if (!/^\d+$/.test(part)) {
      return false;
    }

    const num = Number(part);
    return num >= 0 && num <= 255;
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      ip?: string;
      note?: string;
    };

    const ip = normalizeIp(body.ip ?? "");
    const note = (body.note ?? "").trim();

    if (!ip) {
      return NextResponse.json(
        { error: "IPアドレスを入力してください。" },
        { status: 400 },
      );
    }

    if (!isValidIpv4(ip)) {
      return NextResponse.json(
        { error: "IPv4形式で入力してください。" },
        { status: 400 },
      );
    }

    const existing = await adminDb
      .collection("blocked_ips")
      .where("ip", "==", ip)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({
        success: true,
        duplicated: true,
        message: "このIPアドレスはすでに登録されています。",
        ip,
      });
    }

    const docRef = await adminDb.collection("blocked_ips").add({
      ip,
      note,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "IPを登録しました。",
      id: docRef.id,
      ip,
    });
  } catch (error) {
    console.error("POST /api/admin/add-ip error:", error);

    return NextResponse.json(
      { error: "IPの登録に失敗しました。" },
      { status: 500 },
    );
  }
}
