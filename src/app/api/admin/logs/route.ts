// src/app/api/admin/logs/route.ts
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

type SerializedLog = {
  id: string;
  [key: string]: JsonValue;
};

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 100;
const LEGACY_CUTOFF_TIME = Date.parse("2025-09-16T23:59:59.999Z");

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
    if (
      typeof value !== "string" &&
      typeof value !== "number" &&
      value !== null
    ) {
      continue;
    }

    const text = String(value ?? "").trim();
    if (!text) {
      continue;
    }

    const parsed = Date.parse(text);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }

    const numeric = Number(text);
    if (!Number.isNaN(numeric)) {
      return text.length <= 10 ? numeric * 1000 : numeric;
    }
  }

  return 0;
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function parseStartDate(value: string | null): Date | null {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00.000+09:00`);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function parseEndDate(value: string | null): Date | null {
  if (!value) return null;

  const date = new Date(`${value}T23:59:59.999+09:00`);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const offset = parsePositiveInt(searchParams.get("offset"), 0);
    const requestedLimit = parsePositiveInt(
      searchParams.get("limit"),
      DEFAULT_LIMIT,
    );
    const limit = Math.min(requestedLimit || DEFAULT_LIMIT, MAX_LIMIT);

    const startDate = parseStartDate(searchParams.get("startDate"));
    const endDate = parseEndDate(searchParams.get("endDate"));
    const legacyCutoffDate = new Date(LEGACY_CUTOFF_TIME);
    const effectiveStartDate =
      startDate && startDate.getTime() > LEGACY_CUTOFF_TIME
        ? startDate
        : legacyCutoffDate;

    let query: FirebaseFirestore.Query = adminDb.collection("access_logs");

    query = query.where("timestamp", ">=", effectiveStartDate);

    if (endDate) {
      query = query.where("timestamp", "<=", endDate);
    }

    const snapshot = await query
      .orderBy("timestamp", "desc")
      .offset(offset)
      .limit(limit + 1)
      .get();

    const docs = snapshot.docs;
    const hasMore = docs.length > limit;
    const pageDocs = hasMore ? docs.slice(0, limit) : docs;

    const logs = pageDocs
      .map((doc) => ({
        id: doc.id,
        ...((serializeValue(doc.data()) as Record<string, JsonValue>) || {}),
      }))
      .filter((log) => getSortableTime(log) > LEGACY_CUTOFF_TIME)
      .sort((a, b) => getSortableTime(b) - getSortableTime(a));

    return NextResponse.json({
      logs,
      offset,
      limit,
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (error) {
    console.error("GET /api/admin/logs error:", error);

    return NextResponse.json(
      { error: "アクセスログの取得に失敗しました。" },
      { status: 500 },
    );
  }
}
