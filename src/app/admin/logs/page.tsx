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
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  ); // デフォルト=今日
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // ログ取得
  const fetchLogs = async (date: string, offset: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/logs?date=${date}&offset=${offset}`
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
    fetchLogs(date, offset);
  }, [date, offset]);

  // 日時をフォーマット
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
    const rows = logs.map((log) => [
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
    a.download = `access_logs_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON ダウンロード
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `access_logs_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <AdminNav />

      <h1 className="text-xl font-bold mb-4">アクセスログ</h1>

      {/* 操作バー */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setOffset(0); // ページをリセット
            setDate(e.target.value);
          }}
          className="border rounded px-2 py-1"
        />
        <button
          onClick={() => fetchLogs(date, offset)}
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
      ) : logs.length === 0 ? (
        <p>ログがありません</p>
      ) : (
        <>
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
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="border border-gray-300 px-2 py-1">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">{log.ip}</td>
                  <td className="border border-gray-300 px-2 py-1">
                    {log.country}
                  </td>
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

          {/* ページネーション */}
          <div className="flex justify-between mt-4">
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
        </>
      )}
    </div>
  );
}
