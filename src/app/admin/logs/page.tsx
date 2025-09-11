// src/app/admin/logs/page.tsx
"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";

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
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // フィルタ state
  const [filterCountry, setFilterCountry] = useState("");
  const [filterBlocked, setFilterBlocked] = useState("");
  const [filterAdmin, setFilterAdmin] = useState("");

  const fetchLogs = async (from: string, to: string, offset: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/logs?from=${from}&to=${to}&offset=${offset}`
      );
      const data = await res.json();
      setLogs(data.logs || []);
      setHasMore(data.hasMore);
    } catch (e) {
      console.error("ログ取得失敗:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(fromDate, toDate, offset);
  }, [fromDate, toDate, offset]);

  const formatDate = (iso: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // フィルタ適用
  const filteredLogs = logs.filter((log) => {
    if (filterCountry && log.country !== filterCountry) return false;
    if (filterBlocked === "true" && !log.blocked) return false;
    if (filterBlocked === "false" && log.blocked) return false;
    if (filterAdmin === "true" && !log.isAdmin) return false;
    if (filterAdmin === "false" && log.isAdmin) return false;
    return true;
  });

  // CSV ダウンロード
  const downloadCSV = () => {
    const header = [
      "Timestamp",
      "IP",
      "Country",
      "Allowed",
      "Blocked",
      "isAdmin",
      "UserAgent",
    ];
    const rows = filteredLogs.map((log) => [
      formatDate(log.timestamp),
      log.ip,
      log.country,
      log.allowedCountry ? "Yes" : "No",
      log.blocked ? "Yes" : "No",
      log.isAdmin ? "Yes" : "No",
      `"${log.userAgent || ""}"`,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `access_logs_${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON ダウンロード
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `access_logs_${fromDate}_${toDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ページネーションコンポーネント（上下共通で使用）
  const Pager = () => (
    <div className="flex justify-between my-4">
      <button
        onClick={() => setOffset(Math.max(0, offset - 200))}
        disabled={offset === 0}
        className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
      >
        ◀ 前の200件
      </button>
      <button
        onClick={() => setOffset(offset + 200)}
        disabled={!hasMore}
        className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
      >
        次の200件 ▶
      </button>
    </div>
  );

  return (
    <div className="p-6">
      <AdminNav />
      <h1 className="text-xl font-bold mb-4">アクセスログ</h1>

      {/* 操作バー */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <label>
          From:
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setOffset(0);
              setFromDate(e.target.value);
            }}
            className="ml-2 border rounded px-2 py-1"
          />
        </label>
        <label>
          To:
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setOffset(0);
              setToDate(e.target.value);
            }}
            className="ml-2 border rounded px-2 py-1"
          />
        </label>

        <select
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">全ての国</option>
          {[...new Set(logs.map((l) => l.country))].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={filterBlocked}
          onChange={(e) => setFilterBlocked(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">Blocked 全て</option>
          <option value="true">Blocked = true</option>
          <option value="false">Blocked = false</option>
        </select>

        <select
          value={filterAdmin}
          onChange={(e) => setFilterAdmin(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">isAdmin 全て</option>
          <option value="true">isAdmin = true</option>
          <option value="false">isAdmin = false</option>
        </select>

        <button
          onClick={() => fetchLogs(fromDate, toDate, offset)}
          className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
        >
          Reload
        </button>
        <button
          onClick={downloadCSV}
          className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
        >
          Export CSV
        </button>
        <button
          onClick={downloadJSON}
          className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
        >
          Export JSON
        </button>
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : filteredLogs.length === 0 ? (
        <p>ログがありません</p>
      ) : (
        <>
          <Pager />
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1">Timestamp</th>
                <th className="border border-gray-300 px-2 py-1">IP</th>
                <th className="border border-gray-300 px-2 py-1">Country</th>
                <th className="border border-gray-300 px-2 py-1">Allowed</th>
                <th className="border border-gray-300 px-2 py-1">Blocked</th>
                <th className="border border-gray-300 px-2 py-1">isAdmin</th>
                <th className="border border-gray-300 px-2 py-1">UserAgent</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="border border-gray-300 px-2 py-1">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">{log.ip}</td>
                  <td className="border border-gray-300 px-2 py-1">{log.country}</td>
                  <td className="border border-gray-300 px-2 py-1">
                    {log.allowedCountry ? "✅" : "❌"}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {log.blocked ? "🚫" : "—"}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {log.isAdmin ? "👑" : "—"}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {log.userAgent}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager />
        </>
      )}
    </div>
  );
}
