// src/app/api/admin/logs/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const country = searchParams.get("country");
    const isAdmin = searchParams.get("isAdmin");
    const blocked = searchParams.get("blocked");
    const limit = parseInt(searchParams.get("limit") || "200", 10);

    let queryRef: FirebaseFirestore.Query = db
      .collection("access_logs")
      .orderBy("timestamp", "desc") // 🔹 最新順にソート
      .limit(limit);

    if (country) {
      queryRef = queryRef.where("country", "==", country);
    }
    if (isAdmin) {
      queryRef = queryRef.where("isAdmin", "==", isAdmin === "true");
    }
    if (blocked) {
      queryRef = queryRef.where("blocked", "==", blocked === "true");
    }

    const snapshot = await queryRef.get();

    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ ok: true, logs });
  } catch (err) {
    console.error("Error fetching logs:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
