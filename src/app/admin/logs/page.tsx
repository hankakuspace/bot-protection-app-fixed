// src/app/admin/logs/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type LogItem = Record<string, unknown>;

function toArray(data: unknown): LogItem[] {
  if (Array.isArray(data)) return data as LogItem[];

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (Array.isArray(obj.logs)) return obj.logs as LogItem[];
    if (Array.isArray(obj.items)) return obj.items as LogItem[];
    if (Array.isArray(obj.data)) return obj.data as LogItem[];
  }

  return [];
}

function stringifyValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getCell(log: LogItem, keys: string[]): string {
  for (const key of keys) {
    if (key in log) {
      const value = log[key];
      const text = stringifyValue(value);
      if (text) return text;
    }
  }
  return "";
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [raw, setRaw] = useState("");

  const fetchLogs = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const res = await fetch("/api/admin/logs", {
        method: "GET",
        cache: "no-store",
      });

      const text = await res.text();
      setRaw(text);

      let parsed: unknown = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = text;
      }

      if (!res.ok) {
        throw new Error(
          typeof parsed === "object" &&
            parsed !== null &&
            "error" in (parsed as Record<string, unknown>)
            ? String((parsed as Record<string, unknown>).error)
            : `ログ取得に失敗しました (${res.status})`,
        );
      }

      setLogs(toArray(parsed));
    } catch (err) {
      setLogs([]);
      setError(
        err instanceof Error
          ? err.message
          : "ログ取得中に不明なエラーが発生しました",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchLogs(false);
  }, [fetchLogs]);

  const rows = useMemo(() => {
    return logs.map((log, index) => {
      const timestamp = getCell(log, [
        "createdAt",
        "timestamp",
        "time",
        "date",
      ]);
      const ip = getCell(log, ["ip", "clientIp", "remoteIp"]);
      const blocked = getCell(log, ["blocked", "isBlocked", "result"]);
      const path = getCell(log, ["path", "pathname", "route", "url"]);
      const method = getCell(log, ["method", "httpMethod"]);
      const country = getCell(log, ["country", "countryCode", "geo"]);
      const userAgent = getCell(log, ["userAgent", "ua"]);

      return {
        id: `${index}-${timestamp}-${ip}-${path}`,
        timestamp,
        ip,
        blocked,
        path,
        method,
        country,
        userAgent,
        raw: stringifyValue(log),
      };
    });
  }, [logs]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Admin</p>
            <h1 className="text-3xl font-bold tracking-tight">アクセスログ</h1>
            <p className="mt-2 text-sm text-gray-600">
              管理用ログAPIの結果を表示します。API shape
              が変わっても白画面にならないようにしています。
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchLogs(true)}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading || refreshing}
          >
            {refreshing ? "更新中..." : "再読み込み"}
          </button>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">取得件数</p>
            <p className="mt-2 text-2xl font-bold">{rows.length}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">読込状態</p>
            <p className="mt-2 text-2xl font-bold">
              {loading ? "Loading" : "Ready"}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">API</p>
            <p className="mt-2 text-sm font-semibold text-gray-800">
              /api/admin/logs
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    IP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Blocked
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Path
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Country
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    User-Agent
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      読み込み中...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      表示できるログがありません
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-gray-100 align-top"
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.timestamp || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.ip || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.blocked || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.path || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.method || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.country || "-"}
                      </td>
                      <td className="max-w-[320px] px-4 py-3 text-sm text-gray-700">
                        <div className="line-clamp-3 break-all">
                          {row.userAgent || "-"}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-gray-800">
            API 生レスポンス
          </p>
          <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-all rounded-xl bg-gray-50 p-4 text-xs text-gray-700">
            {raw || "(empty)"}
          </pre>
        </div>
      </div>
    </main>
  );
}
