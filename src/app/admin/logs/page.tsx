// src/app/admin/logs/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type LogItem = Record<string, unknown>;

type LogsResponse = {
  logs?: LogItem[];
  hasMore?: boolean;
  nextOffset?: number | null;
  error?: string;
};

type DisplayRow = {
  id: string;
  timestampRaw: string;
  timestampLabel: string;
  status: string;
  ip: string;
  blocked: string;
  path: string;
  country: string;
  userAgent: string;
};

const PAGE_SIZE = 100;\nconst ADMIN_SHOP = "be-search.biz";
const HIDDEN_LOG_PATHS = ["/api/verify-ip"];

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

function escapeCsv(value: string): string {
  const normalized = value.replace(/\r?\n/g, " ");
  if (
    normalized.includes(",") ||
    normalized.includes('"') ||
    normalized.includes("\n")
  ) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function todayString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function shouldHideLogPath(path: string): boolean {
  return HIDDEN_LOG_PATHS.includes(path);
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [expandedTextKey, setExpandedTextKey] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(todayString());

  const fetchLogs = useCallback(
    async ({
      reset,
      offset,
      silent,
      startDateValue,
      endDateValue,
    }: {
      reset: boolean;
      offset: number;
      silent: boolean;
      startDateValue: string;
      endDateValue: string;
    }) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        setError("");

        const params = new URLSearchParams();
        params.set("offset", String(offset));
        params.set("limit", String(PAGE_SIZE));
        params.set("shop", ADMIN_SHOP);

        if (startDateValue) {
          params.set("startDate", startDateValue);
        }

        if (endDateValue) {
          params.set("endDate", endDateValue);
        }

        const response = await fetch(`/api/admin/logs?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
        });

        const parsed = (await response.json()) as LogsResponse;

        if (!response.ok) {
          throw new Error(
            parsed?.error || `ログ取得に失敗しました (${response.status})`,
          );
        }

        const incomingLogs = toArray(parsed);

        setLogs((prevLogs) => {
          if (reset) {
            return incomingLogs;
          }

          return [
            ...prevLogs,
            ...incomingLogs.filter((incoming) => {
              const incomingId = stringifyValue(
                (incoming as Record<string, unknown>).id,
              );

              return !prevLogs.some(
                (existing) =>
                  stringifyValue((existing as Record<string, unknown>).id) ===
                  incomingId,
              );
            }),
          ];
        });

        setHasMore(Boolean(parsed.hasMore));
        setNextOffset(
          typeof parsed.nextOffset === "number" ? parsed.nextOffset : null,
        );
      } catch (err) {
        if (reset) {
          setLogs([]);
        }

        setError(
          err instanceof Error
            ? err.message
            : "ログ取得中に不明なエラーが発生しました",
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchLogs({
      reset: true,
      offset: 0,
      silent: false,
      startDateValue: startDate,
      endDateValue: endDate,
    });
  }, [fetchLogs, startDate, endDate]);

  const rows = useMemo<DisplayRow[]>(() => {
    return logs
      .map((log, index) => {
        const timestampRaw = getCell(log, [
          "timestamp",
          "createdAt",
          "time",
          "date",
        ]);
        const status = getCell(log, ["status", "state", "resultStatus"]);
        const ip = getCell(log, ["ip", "clientIp", "remoteIp"]);
        const blocked = getCell(log, ["blocked", "isBlocked", "result"]);
        const path = getCell(log, ["path", "pathname", "route", "url", "page"]);
        const country = getCell(log, ["country", "countryCode", "geo"]);
        const userAgent = getCell(log, ["userAgent", "ua"]);

        return {
          id: `${getCell(log, ["id"]) || index}-${timestampRaw}-${ip}-${path}`,
          timestampRaw,
          timestampLabel: formatDateTime(timestampRaw),
          status,
          ip,
          blocked,
          path,
          country,
          userAgent,
        };
      })
      .filter((row) => !shouldHideLogPath(row.path))
      .sort(
        (a, b) =>
          parseTimestamp(b.timestampRaw) - parseTimestamp(a.timestampRaw),
      );
  }, [logs]);

  const filteredRows = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return rows.filter((row) => {
      if (!keyword) return true;

      const searchableText = [
        row.timestampRaw,
        row.timestampLabel,
        row.status,
        row.ip,
        row.blocked,
        row.path,
        row.country,
        row.userAgent,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [rows, searchText]);

  const latestLabel =
    filteredRows[0]?.timestampLabel || rows[0]?.timestampLabel || "-";

  const handleDownloadCsv = useCallback(() => {
    const headers = ["Time", "IP", "Path", "Country", "User-Agent", "Status"];

    const lines = filteredRows.map((row) => {
      const isBlocked =
        row.blocked === "true" ||
        row.blocked === "blocked" ||
        row.status === "blocked";

      const statusLabel = isBlocked ? "Blocked" : "Allowed";

      return [
        row.timestampLabel,
        row.ip || "-",
        row.path || "-",
        row.country || "-",
        row.userAgent || "-",
        statusLabel,
      ]
        .map((value) => escapeCsv(value))
        .join(",");
    });

    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    const suffix = `${startDate || "all"}_${endDate || "all"}`;
    a.href = url;
    a.download = `access-logs_${suffix}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filteredRows, startDate, endDate]);

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#111827]">
      <div className="w-full px-4 py-6 sm:px-6 xl:px-8">
        <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-base font-semibold text-[#111827]">
              Access Logs
            </h1>
            <p className="mt-1 text-xs text-[#6b7280]">
              期間指定とCSVダウンロードに対応しています。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7280]">
                Latest
              </div>
              <div className="mt-1 text-xs font-medium text-[#111827]">
                {latestLabel}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void fetchLogs({
                  reset: true,
                  offset: 0,
                  silent: true,
                  startDateValue: startDate,
                  endDateValue: endDate,
                })
              }
              disabled={loading || refreshing}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#111827] px-4 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "更新中..." : "再読み込み"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mb-4 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[180px_180px_minmax(0,1fr)_auto]">
            <div>
              <label
                htmlFor="startDate"
                className="mb-2 block text-xs font-medium text-[#374151]"
              >
                開始日
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#d1d5db] bg-white px-3 text-xs outline-none focus:border-[#111827]"
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="mb-2 block text-xs font-medium text-[#374151]"
              >
                終了日
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#d1d5db] bg-white px-3 text-xs outline-none focus:border-[#111827]"
              />
            </div>

            <div>
              <label
                htmlFor="searchText"
                className="mb-2 block text-xs font-medium text-[#374151]"
              >
                Search
              </label>
              <input
                id="searchText"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="time / ip / path / country / user-agent / allowed / blocked"
                className="h-10 w-full rounded-xl border border-[#d1d5db] bg-white px-4 text-xs outline-none focus:border-[#111827]"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleDownloadCsv}
                disabled={filteredRows.length === 0}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d1d5db] bg-white px-4 text-xs font-medium text-[#111827] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-60"
              >
                CSVダウンロード
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          {loading ? (
            <div className="px-4 py-16 text-center text-xs text-[#6b7280]">
              読み込み中...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="px-4 py-16 text-center text-xs text-[#6b7280]">
              条件に一致するログがありません
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <table className="min-w-[1760px] w-full border-collapse text-left">
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

                      const isPathExpanded =
                        expandedTextKey === `${row.id}:path`;
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
                            <div className="w-[900px] max-w-[900px]">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedTextKey(
                                    isPathExpanded ? "" : `${row.id}:path`,
                                  )
                                }
                                className="w-full cursor-pointer text-left"
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
                            <div className="w-[620px] max-w-[620px]">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedTextKey(
                                    isUserAgentExpanded
                                      ? ""
                                      : `${row.id}:userAgent`,
                                  )
                                }
                                className="w-full cursor-pointer text-left"
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

              {hasMore ? (
                <div className="border-t border-[#e5e7eb] px-4 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (nextOffset == null || loadingMore) return;
                      void fetchLogs({
                        reset: false,
                        offset: nextOffset,
                        silent: false,
                        startDateValue: startDate,
                        endDateValue: endDate,
                      });
                    }}
                    disabled={loadingMore}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d1d5db] bg-white px-5 text-xs font-medium text-[#111827] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingMore ? "読み込み中..." : "Load More"}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
