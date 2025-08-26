// src/app/admin/logs/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";

interface AccessLog {
  id: string;
  ip: string;
  country: string;
  allowedCountry?: boolean;
  blocked?: boolean;
  isAdmin?: boolean;
  userAgent?: string;
  timestamp: string | null;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string>("");

  // ✅ フィルタ用 state
  const [countryFilter, setCountryFilter] = useState("");
  const [isAdminFilter, setIsAdminFilter] = useState(false);
  const [blockedFilter, setBlockedFilter] = useState(false);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 100;

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/logs");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/verify-hmac" + window.location.search)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setAuthorized(true);
          fetchLogs();
        } else {
          setAuthorized(false);
          setAuthError(data.error || "invalid hmac");
        }
      })
      .catch(() => {
        setAuthorized(false);
        setAuthError("server error");
      });
  }, []);

  // ✅ ログからユニークな国コードを抽出
  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      if (log.country && log.country !== "UNKNOWN") {
        set.add(log.country);
      }
    });
    return Array.from(set).sort();
  }, [logs]);

  if (authorized === null) return <p className="p-4">Verifying access...</p>;
  if (!authorized) {
    return (
      <div className="p-6 text-red-600">
        <h1 className="text-xl font-bold mb-2">Unauthorized</h1>
        <p>This page can only be accessed from Shopify Admin.</p>
        <p className="text-sm text-gray-600 mt-2">Reason: {authError}</p>
      </div>
    );
  }
  if (loading) return <p className="p-4">Loading logs...</p>;

  // ✅ フィルタ処理
  const filteredLogs = logs.filter((log) => {
    if (countryFilter && log.country !== countryFilter) return false;
    if (isAdminFilter && !log.isAdmin) return false;
    if (blockedFilter && !log.blocked) return false;

    if (fromDate) {
      const from = new Date(fromDate).getTime();
      const ts = log.timestamp ? new Date(log.timestamp).getTime() : 0;
      if (ts < from) return false;
    }
    if (toDate) {
      const to = new Date(toDate).getTime();
      const ts = log.timestamp ? new Date(log.timestamp).getTime() : 0;
      if (ts > to) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // ✅ CSVエクスポート
  const exportCSV = () => {
    const header =
      "id,ip,country,allowedCountry,blocked,isAdmin,userAgent,timestamp\n";
    const rows = filteredLogs.map(
      (l) =>
        `${l.id},${l.ip},${l.country},${l.allowedCountry},${l.blocked},${l.isAdmin},${l.userAgent},${l.timestamp}`
    );
    const blob = new Blob([header + rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "logs.csv";
    a.click();
  };

  // ✅ JSONエクスポート
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "logs.json";
    a.click();
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Access Logs</h1>

      {/* ✅ フィルタ UI */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="border px-2 py-1"
        >
          <option value="">All Countries</option>
          {countryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label>
          <input
            type="checkbox"
            checked={isAdminFilter}
            onChange={(e) => setIsAdminFilter(e.target.checked)}
          />{" "}
          isAdmin
        </label>

        <label>
          <input
            type="checkbox"
            checked={blockedFilter}
            onChange={(e) => setBlockedFilter(e.target.checked)}
          />{" "}
          blocked
        </label>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border px-2 py-1"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border px-2 py-1"
        />
      </div>

      {/* ✅ エクスポート */}
      <div className="flex gap-2 mb-4">
        <button onClick={exportCSV} className="px-3 py-1 border rounded">
          Export CSV
        </button>
        <button onClick={exportJSON} className="px-3 py-1 border rounded">
          Export JSON
        </button>
      </div>

      <p className="mb-2 text-sm text-gray-500">
        {filteredLogs.length} 件のログを表示中
      </p>

      {/* ✅ ログテーブル */}
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
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
          {paginatedLogs.map((log, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1">
                {log.timestamp
                  ? new Date(log.timestamp).toLocaleString()
                  : "pending..."}
              </td>
              <td className="border px-2 py-1 font-mono">{log.ip}</td>
              <td className="border px-2 py-1">{log.country}</td>
              <td className="border px-2 py-1">{String(log.allowedCountry)}</td>
              <td className="border px-2 py-1">{String(log.blocked)}</td>
              <td className="border px-2 py-1">{String(log.isAdmin)}</td>
              <td className="border px-2 py-1 max-w-xs break-all">
                {log.userAgent}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ ページネーション */}
      <div className="flex items-center gap-2 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
