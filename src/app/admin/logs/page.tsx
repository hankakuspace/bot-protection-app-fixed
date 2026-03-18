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

function formatDateTime(value: string): string {
  if (!value) return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  const parsed = new Date(trimmed);

  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(parsed);
  }

  const numericValue = Number(trimmed);
  if (!Number.isNaN(numericValue)) {
    const millis = trimmed.length <= 10 ? numericValue * 1000 : numericValue;
    const numericDate = new Date(millis);

    if (!Number.isNaN(numericDate.getTime())) {
      return new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(numericDate);
    }
  }

  return trimmed;
}

function getTypeBadgeClass(type: string): string {
  if (type === "verify-ip") {
    return "border border-blue-200 bg-blue-50 text-blue-700";
  }

  if (type) {
    return "border border-gray-200 bg-gray-50 text-gray-700";
  }

  return "border border-gray-200 bg-white text-gray-500";
}

function getStatusBadgeClass(status: string): string {
  if (status === "blocked") {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  if (status === "allowed" || status === "success") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status) {
    return "border border-gray-200 bg-gray-50 text-gray-700";
  }

  return "border border-gray-200 bg-white text-gray-500";
}

function getBlockedBadgeClass(blocked: string): string {
  if (blocked === "true") {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  if (blocked === "false") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border border-gray-200 bg-white text-gray-500";
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [raw, setRaw] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [blockedFilter, setBlockedFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

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
      const timestampRaw = getCell(log, [
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
        id: `${index}-${timestampRaw}-${ip}-${path}-${method}`,
        timestampRaw,
        timestampLabel: formatDateTime(timestampRaw),
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

  const statusOptions = useMemo(() => {
    const values = Array.from(
      new Set(rows.map((row) => row.status).filter((value) => value)),
    );
    return values.sort((a, b) => a.localeCompare(b, "ja"));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return rows.filter((row) => {
      if (typeFilter !== "all" && row.type !== typeFilter) {
        return false;
      }

      if (statusFilter !== "all" && row.status !== statusFilter) {
        return false;
      }

      if (blockedFilter !== "all" && row.blocked !== blockedFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const searchableText = [
        row.timestampRaw,
        row.timestampLabel,
        row.type,
        row.status,
        row.ip,
        row.blocked,
        row.path,
        row.method,
        row.country,
        row.userAgent,
        row.raw,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [rows, typeFilter, statusFilter, blockedFilter, searchText]);

  const verifyIpCount = useMemo(() => {
    return rows.filter((row) => row.type === "verify-ip").length;
  }, [rows]);

  const blockedCount = useMemo(() => {
    return rows.filter((row) => row.blocked === "true").length;
  }, [rows]);

  const latestTimeLabel = useMemo(() => {
    const first = filteredRows[0] ?? rows[0];
    if (!first) return "-";
    return first.timestampLabel || first.timestampRaw || "-";
  }, [filteredRows, rows]);

  return (
    <main className="min-h-screen bg-white text-gray-950">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                  Admin
                </span>
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                  /api/admin/logs
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Access Logs
              </h1>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                管理用ログAPIの取得結果を表示します。既存の検索・フィルタ・生レスポンス確認機能は維持したまま、
                管理画面として見やすい表示に整理しています。
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Latest
                </div>
                <div className="mt-1 font-medium text-gray-900">
                  {latestTimeLabel}
                </div>
              </div>

              <button
                type="button"
                onClick={() => void fetchLogs(true)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-900 bg-gray-900 px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading || refreshing}
              >
                {refreshing ? "更新中..." : "再読み込み"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="border-b border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Total rows
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
                {rows.length}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                APIから取得した全件数
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                verify-ip
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
                {verifyIpCount}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                type=verify-ip の件数
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                blocked=true
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
                {blockedCount}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                blocked=true の件数
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Status
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
                {loading ? "Loading" : "Ready"}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                管理ログAPIの読込状態
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
            <p className="mt-1 text-sm text-gray-500">
              既存の検索・絞り込み機能をそのまま使えます。
            </p>
          </div>

          <div className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="md:col-span-2 xl:col-span-1">
              <label
                htmlFor="searchText"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                キーワード検索
              </label>
              <input
                id="searchText"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="IP / path / userAgent / type / status"
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="typeFilter"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                type
              </label>
              <select
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-gray-900"
              >
                <option value="all">すべて</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="statusFilter"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-gray-900"
              >
                <option value="all">すべて</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="blockedFilter"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                blocked
              </label>
              <select
                id="blockedFilter"
                value={blockedFilter}
                onChange={(e) => setBlockedFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-gray-900"
              >
                <option value="all">すべて</option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600">
              表示件数:{" "}
              <span className="font-semibold text-gray-900">
                {filteredRows.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchText("");
                setTypeFilter("all");
                setStatusFilter("all");
                setBlockedFilter("all");
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              条件をクリア
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Log entries</h2>
            <p className="mt-1 text-sm text-gray-500">
              生ログを一覧で確認できます。
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Time
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Type
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    IP
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Blocked
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Path
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Method
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Country
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    User-Agent
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-16 text-center text-sm text-gray-500"
                    >
                      読み込み中...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-16 text-center text-sm text-gray-500"
                    >
                      条件に一致するログがありません
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 align-top last:border-b-0"
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                        {row.timestampLabel || row.timestampRaw || "-"}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {row.type ? (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getTypeBadgeClass(row.type)}`}
                          >
                            {row.type}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {row.status ? (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(row.status)}`}
                          >
                            {row.status}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                        {row.ip || "-"}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {row.blocked ? (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getBlockedBadgeClass(row.blocked)}`}
                          >
                            {row.blocked}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="max-w-[300px] px-4 py-4 text-sm text-gray-700">
                        <div className="break-all">{row.path || "-"}</div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                        {row.method ? (
                          <span className="inline-flex rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                            {row.method}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                        {row.country || "-"}
                      </td>

                      <td className="max-w-[360px] px-4 py-4 text-sm text-gray-700">
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

        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Raw API response
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              `/api/admin/logs` の生レスポンス確認用です。
            </p>
          </div>

          <div className="px-5 py-5">
            <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-all rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs leading-6 text-gray-700">
              {raw || "(empty)"}
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}
