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

type SerializedLog = {
  id: string;
  [key: string]: JsonValue;
};

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

function getSortableTime(log: SerializedLog): number {
  const candidates = [log.timestamp, log.createdAt, log.time, log.date];

  for (const value of candidates) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }

    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      return trimmed.length <= 10 ? numeric * 1000 : numeric;
    }
  }

  return 0;
}

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("access_logs")
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();

    const cutoffTime = Date.parse("2025-09-16T23:59:59.999Z");

    const logs = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...((serializeValue(doc.data()) as Record<string, JsonValue>) || {}),
      }))
      .filter((log) => getSortableTime(log) > cutoffTime)
      .sort((a, b) => getSortableTime(b) - getSortableTime(a));

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("GET /api/admin/logs error:", error);

    return NextResponse.json(
      { error: "アクセスログの取得に失敗しました。" },
      { status: 500 },
    );
  }
}
