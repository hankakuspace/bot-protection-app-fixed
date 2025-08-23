// src/app/api/admin/add-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // 🔥 デバッグ: 環境変数の内容をログ
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || "";
  console.log("🔥 FIREBASE_PRIVATE_KEY head:", rawKey.slice(0, 100));
  console.log("🔥 FIREBASE_PRIVATE_KEY tail:", rawKey.slice(-50));
  console.log("🔥 containsRealNewline:", rawKey.includes("\n"));
  console.log("🔥 containsEscapedNewline:", rawKey.includes("\\n"));
  console.log("🔥 length:", rawKey.length);

  // ここから本来の処理
  try {
    await db.collection("ip_blocks").add({
      ip: body.ip,
      createdAt: new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in add-ip:", error);
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}
