// src/app/api/admin/block-country/list/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("blocked_countries")
      .orderBy("createdAt", "desc")
      .get();

    const countries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id, // ← これを必ず入れる
        countryCode: data.countryCode,
        createdAt: data.createdAt
          ? data.createdAt.toDate().toISOString()
          : null,
      };
    });

    return NextResponse.json(countries);
  } catch (err: any) {
    console.error("block-country/list error:", err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
