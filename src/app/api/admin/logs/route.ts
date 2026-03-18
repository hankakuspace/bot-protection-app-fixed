// src/app/api/admin/logs/route.ts
import { NextResponse } from "next/server";
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
    const snapshot = await adminDb
      .collection("access_logs")
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();

    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...((serializeValue(doc.data()) as Record<string, JsonValue>) || {}),
    }));

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("GET /api/admin/logs error:", error);

    return NextResponse.json(
      { error: "アクセスログの取得に失敗しました。" },
      { status: 500 },
    );
  }
}
