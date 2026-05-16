// src/app/admin/logs/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type LogItem = Record<string, unknown>;

type DisplayRow = {
  id: string;
  timestampRaw: string;
  timestampLabel: string;
  type: string;
  status: string;
  ip: string;
  blocked: string;
  path: string;
  method: string;
  country: string;
  shop: string;
  source: string;
  referer: string;
  userAgent: string;
  raw: string;
};

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
      const text = stringifyValue(log[key]);
      if (text) return text;
    }
  }
  return "";
}

function parseTimestamp(value: string): number {
  if (!value) return 0;

  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) return parsed;

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return value.length <= 10 ? numeric * 1000 : numeric;
  }

  return 0;
}

function formatDateTime(value: string): string {
  if (!value) return "-";

  const time = parseTimestamp(value);
  if (!time) return value;

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(time));
}

function badgeClass(
  type: "type" | "status" | "blocked",
  value: string,
): string {
  if (type === "type") {
    if (value === "theme-access") {
      return "border-blue-200 bg-blue-50 text-blue-700";
    }
    if (value === "verify-ip") {
      return "border-violet-200 bg-violet-50 text-violet-700";
    }
    return "border-gray-200 bg-gray-50 text-gray-700";
  }

  if (type === "status") {
    if (value === "blocked") {
      return "border-red-200 bg-red-50 text-red-700";
    }
    if (value === "loaded" || value === "allowed" || value === "success") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    return "border-gray-200 bg-gray-50 text-gray-700";
  }

  if (value === "true") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (value === "false") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  return "border-gray-200 bg-gray-50 text-gray-700";
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [raw, setRaw] = useState("");
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [blockedFilter, setBlockedFilter] = useState("all");
  const [expandedTextKey, setExpandedTextKey] = useState("");

  const fetchLogs = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/admin/logs", {
        method: "GET",
        cache: "no-store",
      });

      const text = await response.text();
      setRaw(text);

      let parsed: unknown = null;

      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = text;
      }

      if (!response.ok) {
        throw new Error(
          typeof parsed === "object" &&
            parsed !== null &&
            "error" in (parsed as Record<string, unknown>)
            ? String((parsed as Record<string, unknown>).error)
            : `ログ取得に失敗しました (${response.status})`,
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

  const rows = useMemo<DisplayRow[]>(() => {
    return logs
      .map((log, index) => {
        const timestampRaw = getCell(log, [
          "timestamp",
          "createdAt",
          "time",
          "date",
        ]);
        const type = getCell(log, ["type", "logType", "eventType"]);
        const status = getCell(log, ["status", "state", "resultStatus"]);
        const ip = getCell(log, ["ip", "clientIp", "remoteIp"]);
        const blocked = getCell(log, ["blocked", "isBlocked", "result"]);
        const path = getCell(log, ["path", "pathname", "route", "url", "page"]);
        const method = getCell(log, ["method", "httpMethod"]);
        const country = getCell(log, ["country", "countryCode", "geo"]);
        const shop = getCell(log, ["shop"]);
        const source = getCell(log, ["source"]);
        const referer = getCell(log, ["referer", "referrer"]);
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
          shop,
          source,
          referer,
          userAgent,
          raw: stringifyValue(log),
        };
      })
      .sort(
        (a, b) =>
          parseTimestamp(b.timestampRaw) - parseTimestamp(a.timestampRaw),
      );
  }, [logs]);

  const typeOptions = useMemo(() => {
    return Array.from(
      new Set(rows.map((row) => row.type).filter((value) => value)),
    ).sort((a, b) => a.localeCompare(b, "ja"));
  }, [rows]);

  const statusOptions = useMemo(() => {
    return Array.from(
      new Set(rows.map((row) => row.status).filter((value) => value)),
    ).sort((a, b) => a.localeCompare(b, "ja"));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return rows.filter((row) => {
      if (typeFilter !== "all" && row.type !== typeFilter) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (blockedFilter !== "all" && row.blocked !== blockedFilter)
        return false;

      if (!keyword) return true;

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
        row.shop,
        row.source,
        row.referer,
        row.userAgent,
        row.raw,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [rows, searchText, typeFilter, statusFilter, blockedFilter]);

  const totalCount = rows.length;
  const themeAccessCount = rows.filter(
    (row) => row.type === "theme-access",
  ).length;
  const verifyIpCount = rows.filter((row) => row.type === "verify-ip").length;
  const blockedCount = rows.filter((row) => row.blocked === "true").length;
  const latestLabel =
    filteredRows[0]?.timestampLabel || rows[0]?.timestampLabel || "-";

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#111827]">
      <div className="w-full px-4 py-6 sm:px-6 xl:px-8">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1 text-xs font-medium text-[#4b5563]">
                Admin
              </span>
              <span className="inline-flex items-center rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1 text-xs font-medium text-[#4b5563]">
                Logs
              </span>
              <span className="inline-flex items-center rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1 text-xs font-medium text-[#4b5563]">
                /api/admin/logs
              </span>
            </div>

            <h1 className="text-[28px] font-semibold tracking-tight text-[#111827]">
              Access Logs
            </h1>
            <p className="mt-2 text-sm text-[#6b7280]">
              theme-access、verify-ip、旧形式ログを一覧で確認できます。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7280]">
                Latest
              </div>
              <div className="mt-1 text-sm font-medium text-[#111827]">
                {latestLabel}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void fetchLogs(true)}
              disabled={loading || refreshing}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#111827] px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "更新中..." : "再読み込み"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7280]">
              Total
            </div>
            <div className="mt-2 text-3xl font-semibold text-[#111827]">
              {totalCount}
            </div>
            <div className="mt-2 text-sm text-[#6b7280]">取得件数</div>
          </div>

          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7280]">
              Theme Access
            </div>
            <div className="mt-2 text-3xl font-semibold text-[#111827]">
              {themeAccessCount}
            </div>
            <div className="mt-2 text-sm text-[#6b7280]">通常アクセスログ</div>
          </div>

          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7280]">
              Verify IP
            </div>
            <div className="mt-2 text-3xl font-semibold text-[#111827]">
              {verifyIpCount}
            </div>
            <div className="mt-2 text-sm text-[#6b7280]">verify-ipログ</div>
          </div>

          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7280]">
              Blocked
            </div>
            <div className="mt-2 text-3xl font-semibold text-[#111827]">
              {blockedCount}
            </div>
            <div className="mt-2 text-sm text-[#6b7280]">blocked=true</div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="border-b border-[#e5e7eb] px-4 py-4">
            <h2 className="text-sm font-semibold text-[#111827]">Filters</h2>
          </div>

          <div className="grid gap-4 px-4 py-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label
                htmlFor="searchText"
                className="mb-2 block text-sm font-medium text-[#374151]"
              >
                キーワード検索
              </label>
              <input
                id="searchText"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="time / ip / path / country / user-agent / allowed / blocked"
                className="h-11 w-full rounded-xl border border-[#d1d5db] bg-white px-4 text-sm text-left outline-none focus:border-[#111827]"
              />
            </div>

            <div>
              <label
                htmlFor="typeFilter"
                className="mb-2 block text-sm font-medium text-[#374151]"
              >
                type
              </label>
              <select
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#d1d5db] bg-white px-4 text-sm text-left outline-none focus:border-[#111827]"
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
                className="mb-2 block text-sm font-medium text-[#374151]"
              >
                status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#d1d5db] bg-white px-4 text-sm text-left outline-none focus:border-[#111827]"
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
                className="mb-2 block text-sm font-medium text-[#374151]"
              >
                blocked
              </label>
              <select
                id="blockedFilter"
                value={blockedFilter}
                onChange={(e) => setBlockedFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#d1d5db] bg-white px-4 text-sm text-left outline-none focus:border-[#111827]"
              >
                <option value="all">すべて</option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#e5e7eb] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-[#6b7280]">
              表示件数:{" "}
              <span className="font-semibold text-[#111827]">
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
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d1d5db] bg-white px-4 text-sm font-medium text-[#374151] transition hover:bg-[#f9fafb]"
            >
              条件をクリア
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="border-b border-[#e5e7eb] px-4 py-4">
            <h2 className="text-sm font-semibold text-[#111827]">
              Log entries
            </h2>
          </div>

          {loading ? (
            <div className="px-4 py-16 text-center text-sm text-[#6b7280]">
              読み込み中...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-[#6b7280]">
              条件に一致するログがありません
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="min-w-[1700px] w-full border-collapse text-left">
                <thead className="bg-[#fafafa]">
                  <tr className="border-b border-[#e5e7eb]">
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-[#6b7280]">
                      Time
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-[#6b7280]">
                      IP
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-[#6b7280]">
                      Path
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-[#6b7280]">
                      Country
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-[#6b7280]">
                      User-Agent
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold text-[#6b7280]">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row) => {
                    const isBlocked =
                      row.blocked === "true" ||
                      row.blocked === "blocked" ||
                      row.status === "blocked";

                    const isPathExpanded = expandedTextKey === `${row.id}:path`;
                    const isUserAgentExpanded =
                      expandedTextKey === `${row.id}:userAgent`;

                    return (
                      <tr
                        key={row.id}
                        className="border-b border-[#eef2f7] align-top hover:bg-[#fafafa]"
                      >
                        <td className="px-3 py-3 text-xs text-[#111827]">
                          <div className="whitespace-nowrap">
                            {row.timestampLabel}
                          </div>
                        </td>

                        <td className="px-3 py-3 text-xs text-[#111827]">
                          <div className="whitespace-nowrap">
                            {row.ip || "-"}
                          </div>
                        </td>

                        <td className="px-3 py-3 text-xs text-[#111827]">
                          <div className="w-[760px] max-w-[760px]">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedTextKey(
                                  isPathExpanded ? "" : `${row.id}:path`
                                )
                              }
                              className="w-full text-left cursor-pointer"
                              title={row.path || "-"}
                            >
                              <div
                                className={
                                  isPathExpanded
                                    ? "break-all"
                                    : "overflow-hidden text-ellipsis whitespace-nowrap"
                                }
                              >
                                {row.path || "-"}
                              </div>
                            </button>
                          </div>
                        </td>

                        <td className="px-3 py-3 text-xs text-[#111827]">
                          <div className="whitespace-nowrap">
                            {row.country || "-"}
                          </div>
                        </td>

                        <td className="px-3 py-3 text-xs text-[#111827]">
                          <div className="w-[520px] max-w-[520px]">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedTextKey(
                                  isUserAgentExpanded ? "" : `${row.id}:userAgent`
                                )
                              }
                              className="w-full text-left cursor-pointer"
                              title={row.userAgent || "-"}
                            >
                              <div
                                className={
                                  isUserAgentExpanded
                                    ? "break-all"
                                    : "overflow-hidden text-ellipsis whitespace-nowrap"
                                }
                              >
                                {row.userAgent || "-"}
                              </div>
                            </button>
                          </div>
                        </td>

                        <td className="px-3 py-3 text-xs text-[#111827]">
                          {isBlocked ? (
                            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                              Blocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                              Allowed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
