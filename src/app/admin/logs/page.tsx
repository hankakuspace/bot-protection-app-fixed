// src/app/admin/logs/page.tsx
"use client";

import { useEffect, useState } from "react";

interface AccessLog {
  id: string;
  ip: string;
  country: string;
  allowedCountry?: boolean;
  blocked?: boolean;
  isAdmin?: boolean;
  userAgent?: string;
  createdAt?: string | null;
}

// ✅ 日本時間に整形
function formatDate(isoString: string | null): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  // フィルタ
  const [countryFilter, setCountryFilter] = useState("");
  const [isAdminFilter, setIsAdminFilter] = useState(false);
  const [blockedFilter, setBlockedFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ページネーション
  const [page, setPage] = useState(1);
  const pageSize = 100;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logs");
      const data = await res.json();
      if (data.ok) {
        // ✅ createdAt を基準に並べ替え
        const sorted = data.logs.sort((a: AccessLog, b: AccessLog) => {
          if (!a.createdAt && b.createdAt) return 1;
          if (a.createdAt && !b.createdAt) return -1;
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return 0;
        });
        setLogs(sorted);
      }
    } catch (err) {
      console.error("fetch logs error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) return <div>Loading...</div>;

  // ✅ フィルタリング処理
  const filtered = logs.filter((log) => {
    if (countryFilter && log.country !== countryFilter) return false;
    if (isAdminFilter && !log.isAdmin) return false;
    if (blockedFilter && !log.blocked) return false;

    if (dateFrom && log.createdAt) {
      if (new Date(log.createdAt) < new Date(dateFrom)) return false;
    }
    if (dateTo && log.createdAt) {
      if (new Date(log.createdAt) > new Date(dateTo)) return false;
    }

    return true;
  });

  // ページ分割
  const totalPages = Math.ceil(filtered.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paged = filtered.slice(startIndex, startIndex + pageSize);

  // ✅ CSVエクスポート
  const exportCSV = () => {
    const header = ["Timestamp", "IP", "Country", "Allowed", "Blocked", "isAdmin", "UserAgent"];
    const rows = filtered.map((log) => [
      formatDate(log.createdAt || null),
      log.ip,
      log.country,
      log.allowedCountry ? "Yes" : "No",
      log.blocked ? "Yes" : "No",
      log.isAdmin ? "Yes" : "No",
      log.userAgent,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "access_logs.csv";
    a.click();
  };

  // ✅ JSONエクスポート
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "access_logs.json";
    a.click();
  };

  // ✅ Pager コンポーネント
  const Pager = () => (
    <div className="flex justify-center items-center gap-4 my-2">
      <button
        disabled={page <= 1}
        onClick={() => setPage((p) => p - 1)}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        ← Prev
      </button>
      <span>
        Page {page} / {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => setPage((p) => p + 1)}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next →
      </button>
    </div>
  );

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Access Logs</h1>

      <div className="flex gap-2 mb-4">
        {/* 国コードフィルタ */}
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="border px-2 py-1"
        >
          <option value="">All Countries</option>
          {[...new Set(logs.map((l) => l.country))].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* isAdmin / blocked */}
        <label>
          <input
            type="checkbox"
            checked={isAdminFilter}
            onChange={(e) => setIsAdminFilter(e.target.checked)}
          />
          isAdmin
        </label>
        <label>
          <input
            type="checkbox"
            checked={blockedFilter}
            onChange={(e) => setBlockedFilter(e.target.checked)}
          />
          blocked
        </label>

        {/* 日付範囲 */}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border px-2 py-1"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border px-2 py-1"
        />

        {/* エクスポート */}
        <button onClick={exportCSV} className="border px-2 py-1 bg-gray-100">
          Export CSV
        </button>
        <button onClick={exportJSON} className="border px-2 py-1 bg-gray-100">
          Export JSON
        </button>

        {/* リロード */}
        <button onClick={fetchLogs} className="border px-2 py-1 bg-blue-100">
          Reload
        </button>
      </div>

      {/* Pager (上) */}
      <Pager />

      {/* テーブル */}
      <table className="table-auto border-collapse border border-gray-400 w-full text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-2 py-1">Timestamp</th>
            <th className="border px-2 py-1">IP</th>
            <th className="border px-2 py-1">Country</th>
            <th className="border px-2 py-1">Allowed</th>
            <th className="border px-2 py-1">Blocked</th>
            <th className="border px-2 py-1">isAdmin</th>
            <th className="border px-2 py-1">UserAgent</th>
          </tr>
        </thead>
        <tbody>
          {paged.map((log) => (
            <tr key={log.id}>
              <td className="border px-2 py-1">{formatDate(log.createdAt || null)}</td>
              <td className="border px-2 py-1">{log.ip}</td>
              <td className="border px-2 py-1">{log.country}</td>
              <td className="border px-2 py-1">{log.allowedCountry ? "Yes" : "No"}</td>
              <td className="border px-2 py-1">{log.blocked ? "Yes" : "No"}</td>
              <td className="border px-2 py-1">{log.isAdmin ? "Yes" : "No"}</td>
              <td className="border px-2 py-1">{log.userAgent}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pager (下) */}
      <Pager />
    </div>
  );
}
