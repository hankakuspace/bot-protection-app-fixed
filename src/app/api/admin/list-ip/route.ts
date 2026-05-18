// src/app/api/admin/list-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function serializeValue(value: unknown): JsonValue {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item));
  }

  if (typeof value === "object") {
    const maybeTimestamp = value as { toDate?: () => Date };

    if (typeof maybeTimestamp.toDate === "function") {
      return maybeTimestamp.toDate().toISOString();
    }

    const result: { [key: string]: JsonValue } = {};

    for (const [key, nestedValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      result[key] = serializeValue(nestedValue);
    }

    return result;
  }

  return String(value);
}

export async function GET() {
  try {
    let snapshot;

    try {
      snapshot = await adminDb
        .collection("blocked_ips")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();
    } catch {
      snapshot = await adminDb.collection("blocked_ips").limit(100).get();
    }

    const ips = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...((serializeValue(doc.data()) as Record<string, JsonValue>) || {}),
    }));

    return NextResponse.json({ ips });
  } catch (error) {
    console.error("GET /api/admin/list-ip error:", error);

    return NextResponse.json(
      { error: "ブロックIP一覧の取得に失敗しました。" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        { error: "削除対象のIDが指定されていません。" },
        { status: 400 },
      );
    }

    await adminDb.collection("blocked_ips").doc(id).delete();

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error) {
    console.error("DELETE /api/admin/list-ip error:", error);

    return NextResponse.json(
      { error: "ブロックIPの削除に失敗しました。" },
      { status: 500 },
    );
  }
}
