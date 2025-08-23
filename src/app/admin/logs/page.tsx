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
  timestamp: any;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState("");
  const [isAdminFilter, setIsAdminFilter] = useState(false);
  const [blockedFilter, setBlockedFilter] = useState(false);

  // ページネーション
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/admin/logs");
        const data = await res.json();
        setLogs(data.logs || []);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  // フィルタ適用
  const filteredLogs = logs.filter((log) => {
    if (countryFilter && log.country !== countryFilter) return false;
    if (isAdminFilter && !log.isAdmin) return false;
    if (blockedFilter && !log.blocked) return false;
    return true;
  });

  // ページネーション処理
  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  // CSV Export
  const handleCsvExport = () => {
    const header = ["Timestamp", "IP", "Country", "Allowed", "Blocked", "Admin", "UserAgent"];
    const rows = filteredLogs.map((log) => [
      log.timestamp?._seconds
        ? new Date(log.timestamp._seconds * 1000).toLocaleString()
        : typeof log.timestamp === "number"
        ? new Date(log.timestamp).toLocaleString()
        : "",
      log.ip,
      log.country,
      String(log.allowedCountry),
      String(log.blocked),
      String(log.isAdmin),
      log.userAgent || "",
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "access_logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON Export
  const handleJsonExport = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "access_logs.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <p className="p-4">Loading logs...</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Access Logs</h1>

      {/* フィルタ */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Country code (例: JP)"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <label>
          <input
            type="checkbox"
            checked={isAdminFilter}
            onChange={(e) => setIsAdminFilter(e.target.checked)}
            className="mr-1"
          />
          isAdmin
        </label>
        <label>
          <input
            type="checkbox"
            checked={blockedFilter}
            onChange={(e) => setBlockedFilter(e.target.checked)}
            className="mr-1"
          />
          blocked
        </label>
        <button
          onClick={() => setPage(1)}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          フィルタ適用
        </button>
      </div>

      {/* エクスポート */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleCsvExport}
          className="bg-green-500 text-white px-3 py-1 rounded"
        >
          CSV Export
        </button>
        <button
          onClick={handleJsonExport}
          className="bg-gray-600 text-white px-3 py-1 rounded"
        >
          JSON Export
        </button>
      </div>

      <p className="mb-2 text-sm text-gray-500">
        {filteredLogs.length} 件のログを表示中
      </p>

      {/* テーブル */}
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Timestamp</th>
            <th className="border px-2 py-1">IP</th>
            <th className="border px-2 py-1">Country</th>
            <th className="border px-2 py-1">Allowed</th>
            <th className="border px-2 py-1">Blocked</th>
            <th className="border px-2 py-1">Admin</th>
            <th className="border px-2 py-1">UserAgent</th>
          </tr>
        </thead>
        <tbody>
          {paginatedLogs.map((log) => (
            <tr key={log.id}>
              <td className="border px-2 py-1">
                {log.timestamp?._seconds
                  ? new Date(log.timestamp._seconds * 1000).toLocaleString()
                  : typeof log.timestamp === "number"
                  ? new Date(log.timestamp).toLocaleString()
                  : ""}
              </td>
              <td className="border px-2 py-1">{log.ip}</td>
              <td className="border px-2 py-1">{log.country}</td>
              <td className="border px-2 py-1">{String(log.allowedCountry)}</td>
              <td className="border px-2 py-1">{String(log.blocked)}</td>
              <td className="border px-2 py-1">{String(log.isAdmin)}</td>
              <td className="border px-2 py-1 truncate max-w-xs">
                {log.userAgent}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ページネーション */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          前へ
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          次へ
        </button>
      </div>
    </div>
  );
}
