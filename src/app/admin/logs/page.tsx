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
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

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
  const [typeFilter, setTypeFilter] = useState("all");

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
      const type = getCell(log, ["type", "logType", "eventType"]);
      const status = getCell(log, ["status", "state", "resultStatus"]);
      const ip = getCell(log, ["ip", "clientIp", "remoteIp"]);
      const blocked = getCell(log, ["blocked", "isBlocked", "result"]);
      const path = getCell(log, ["path", "pathname", "route", "url"]);
      const method = getCell(log, ["method", "httpMethod"]);
      const country = getCell(log, ["country", "countryCode", "geo"]);
      const userAgent = getCell(log, ["userAgent", "ua"]);

      return {
        id: `${index}-${timestamp}-${ip}-${path}-${method}`,
        timestamp,
        type,
        status,
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

  const typeOptions = useMemo(() => {
    const values = Array.from(
      new Set(rows.map((row) => row.type).filter((value) => value)),
    );
    return values.sort((a, b) => a.localeCompare(b, "ja"));
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (typeFilter === "all") {
      return rows;
    }
    return rows.filter((row) => row.type === typeFilter);
  }, [rows, typeFilter]);

  const verifyIpCount = useMemo(() => {
    return rows.filter((row) => row.type === "verify-ip").length;
  }, [rows]);

  const blockedCount = useMemo(() => {
    return rows.filter((row) => row.blocked === "true").length;
  }, [rows]);

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

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">取得件数</p>
            <p className="mt-2 text-2xl font-bold">{rows.length}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">verify-ip 件数</p>
            <p className="mt-2 text-2xl font-bold">{verifyIpCount}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">blocked=true 件数</p>
            <p className="mt-2 text-2xl font-bold">{blockedCount}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">読込状態</p>
            <p className="mt-2 text-2xl font-bold">
              {loading ? "Loading" : "Ready"}
            </p>
            <p className="mt-2 text-sm font-semibold text-gray-800">
              /api/admin/logs
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="w-full max-w-sm">
              <label
                htmlFor="typeFilter"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                type フィルタ
              </label>
              <select
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-500"
              >
                <option value="all">すべて</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-600">
              表示件数:{" "}
              <span className="font-semibold text-gray-900">
                {filteredRows.length}
              </span>
            </div>
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
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Status
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
                      colSpan={9}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      読み込み中...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      条件に一致するログがありません
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-gray-100 align-top"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {row.timestamp || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.type ? (
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {row.type}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.status ? (
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                            {row.status}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {row.ip || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.blocked === "true" ? (
                          <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                            true
                          </span>
                        ) : row.blocked === "false" ? (
                          <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                            false
                          </span>
                        ) : (
                          row.blocked || "-"
                        )}
                      </td>
                      <td className="max-w-[280px] px-4 py-3 text-sm text-gray-700">
                        <div className="break-all">{row.path || "-"}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {row.method ? (
                          <span className="inline-flex rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                            {row.method}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
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
