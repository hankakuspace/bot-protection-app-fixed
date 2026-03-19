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

function getTypeTone(type: string): string {
  if (type === "theme-access") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  if (type === "verify-ip") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }
  return "border-gray-200 bg-gray-50 text-gray-700";
}

function getStatusTone(status: string): string {
  if (status === "blocked") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (status === "allowed" || status === "loaded" || status === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  return "border-gray-200 bg-gray-50 text-gray-700";
}

function getBlockedTone(blocked: string): string {
  if (blocked === "true") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (blocked === "false") {
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
  const [expandedRowId, setExpandedRowId] = useState("");

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

      const searchable = [
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

      return searchable.includes(keyword);
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
    <main className="min-h-screen bg-[#fafafa] text-[#111111]">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#e5e7eb] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-2.5 py-1 text-xs font-medium text-[#4b5563]">
                  Admin
                </span>
                <span className="inline-flex items-center rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-2.5 py-1 text-xs font-medium text-[#4b5563]">
                  Logs
                </span>
                <span className="inline-flex items-center rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-2.5 py-1 text-xs font-medium text-[#4b5563]">
                  /api/admin/logs
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Access Logs
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                通常アクセス、verify-ip、旧形式ログをまとめて確認できます。
                既存の検索・絞り込み・生レスポンス確認は維持したまま、見やすさを整理しています。
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="rounded-2xl border border-[#e5e7eb] bg-[#fafafa] px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                  Latest
                </div>
                <div className="mt-1 text-sm font-medium text-[#111111]">
                  {latestLabel}
                </div>
              </div>

              <button
                type="button"
                onClick={() => void fetchLogs(true)}
                disabled={loading || refreshing}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#111111] px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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

          <div className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                Total
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight">
                {totalCount}
              </div>
              <div className="mt-2 text-sm text-[#6b7280]">取得件数</div>
            </div>

            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                Theme Access
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight">
                {themeAccessCount}
              </div>
              <div className="mt-2 text-sm text-[#6b7280]">
                通常アクセス記録
              </div>
            </div>

            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                Verify IP
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight">
                {verifyIpCount}
              </div>
              <div className="mt-2 text-sm text-[#6b7280]">verify-ipログ</div>
            </div>

            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                Blocked
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight">
                {blockedCount}
              </div>
              <div className="mt-2 text-sm text-[#6b7280]">blocked=true</div>
            </div>

            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                Status
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight">
                {loading ? "Loading" : "Ready"}
              </div>
              <div className="mt-2 text-sm text-[#6b7280]">一覧取得状態</div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="border-b border-[#e5e7eb] px-5 py-4">
            <h2 className="text-sm font-semibold text-[#111111]">Filters</h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              キーワード、type、status、blocked で絞り込めます。
            </p>
          </div>

          <div className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
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
                placeholder="type / shop / path / ip / userAgent"
                className="h-11 w-full rounded-xl border border-[#d1d5db] bg-white px-4 text-sm outline-none transition focus:border-[#111111]"
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
                className="h-11 w-full rounded-xl border border-[#d1d5db] bg-white px-4 text-sm outline-none transition focus:border-[#111111]"
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
                className="h-11 w-full rounded-xl border border-[#d1d5db] bg-white px-4 text-sm outline-none transition focus:border-[#111111]"
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
                className="h-11 w-full rounded-xl border border-[#d1d5db] bg-white px-4 text-sm outline-none transition focus:border-[#111111]"
              >
                <option value="all">すべて</option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#e5e7eb] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-[#6b7280]">
              表示件数:{" "}
              <span className="font-semibold text-[#111111]">
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
          <div className="border-b border-[#e5e7eb] px-5 py-4">
            <h2 className="text-sm font-semibold text-[#111111]">
              Log entries
            </h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              各ログをカード形式で確認できます。クリックで詳細を開きます。
            </p>
          </div>

          {loading ? (
            <div className="px-5 py-16 text-center text-sm text-[#6b7280]">
              読み込み中...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-[#6b7280]">
              条件に一致するログがありません
            </div>
          ) : (
            <div className="divide-y divide-[#eef2f7]">
              {filteredRows.map((row) => {
                const isExpanded = expandedRowId === row.id;

                return (
                  <div key={row.id} className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setExpandedRowId(isExpanded ? "" : row.id)}
                      className="w-full rounded-2xl border border-[#e5e7eb] bg-white p-4 text-left transition hover:bg-[#fafafa]"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getTypeTone(row.type)}`}
                            >
                              {row.type || "-"}
                            </span>
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusTone(row.status)}`}
                            >
                              {row.status || "-"}
                            </span>
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getBlockedTone(row.blocked)}`}
                            >
                              blocked: {row.blocked || "-"}
                            </span>
                            {row.method ? (
                              <span className="inline-flex rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-2.5 py-1 text-xs font-medium text-[#4b5563]">
                                {row.method}
                              </span>
                            ) : null}
                          </div>

                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                                Time
                              </div>
                              <div className="mt-1 break-all text-sm text-[#111111]">
                                {row.timestampLabel}
                              </div>
                            </div>

                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                                IP
                              </div>
                              <div className="mt-1 break-all text-sm text-[#111111]">
                                {row.ip || "-"}
                              </div>
                            </div>

                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                                Shop
                              </div>
                              <div className="mt-1 break-all text-sm text-[#111111]">
                                {row.shop || "-"}
                              </div>
                            </div>

                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                                Source
                              </div>
                              <div className="mt-1 break-all text-sm text-[#111111]">
                                {row.source || "-"}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <div className="xl:col-span-2">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                                Path
                              </div>
                              <div className="mt-1 break-all text-sm text-[#111111]">
                                {row.path || "-"}
                              </div>
                            </div>

                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                                Country
                              </div>
                              <div className="mt-1 break-all text-sm text-[#111111]">
                                {row.country || "-"}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-sm font-medium text-[#6b7280]">
                          {isExpanded ? "詳細を閉じる" : "詳細を開く"}
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className="mt-5 grid gap-4 border-t border-[#eef2f7] pt-5 lg:grid-cols-2">
                          <div>
                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                              Referer
                            </div>
                            <div className="rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-3 text-sm break-all text-[#111111]">
                              {row.referer || "-"}
                            </div>
                          </div>

                          <div>
                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                              User-Agent
                            </div>
                            <div className="rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-3 text-sm break-all text-[#111111]">
                              {row.userAgent || "-"}
                            </div>
                          </div>

                          <div className="lg:col-span-2">
                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                              Raw
                            </div>
                            <pre className="max-h-[320px] overflow-auto rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-3 text-xs leading-6 text-[#374151]">
                              {row.raw}
                            </pre>
                          </div>
                        </div>
                      ) : null}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="border-b border-[#e5e7eb] px-5 py-4">
            <h2 className="text-sm font-semibold text-[#111111]">
              Raw API response
            </h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              `/api/admin/logs` の生レスポンス確認用です。
            </p>
          </div>

          <div className="px-5 py-5">
            <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-all rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-4 text-xs leading-6 text-[#374151]">
              {raw || "(empty)"}
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}
