// src/app/admin/logs/page.tsx
"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import "flag-icons/css/flag-icons.min.css";

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
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
      d.getDate()
    ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  };

  const filteredLogs = logs.filter((log) => {
    if (filterCountry && log.country !== filterCountry) return false;
    if (filterBlocked === "true" && !log.blocked) return false;
    if (filterBlocked === "false" && log.blocked) return false;
    if (filterAdmin === "true" && !log.isAdmin) return false;
    if (filterAdmin === "false" && log.isAdmin) return false;
    return true;
  });

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
                <th className="border px-2 py-1">Timestamp</th>
                <th className="border px-2 py-1">IP</th>
                <th className="border px-2 py-1">Country</th>
                <th className="border px-2 py-1">Allowed</th>
                <th className="border px-2 py-1">isAdmin</th>
                <th className="border px-2 py-1">UserAgent</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  {/* Timestamp (小さい文字) */}
                  <td className="border px-2 py-1 text-xs">
                    {formatDate(log.timestamp)}
                  </td>

                  {/* IP列 → Blocked状態 */}
                  <td className="border px-2 py-1 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          log.blocked ? "bg-red-500" : "bg-green-500"
                        }`}
                      />
                      <span>{log.ip}</span>
                    </div>
                  </td>

                  {/* Country列 → Allowed状態 */}
                  <td className="border px-2 py-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          log.allowedCountry ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <span className={`fi fi-${log.country?.toLowerCase()}`} />
                      <span>{log.country}</span>
                    </div>
                  </td>

                  {/* Allowed列は ✅/❌ のまま */}
                  <td className="border px-2 py-1 text-xs">
                    {log.allowedCountry ? "✅" : "❌"}
                  </td>

                  {/* isAdmin (小さい文字) */}
                  <td className="border px-2 py-1 text-xs">
                    {log.isAdmin ? "👑" : "—"}
                  </td>

                  {/* UserAgent (小さい文字, 省略表示) */}
                  <td className="border px-2 py-1 max-w-xs truncate text-xs">
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
