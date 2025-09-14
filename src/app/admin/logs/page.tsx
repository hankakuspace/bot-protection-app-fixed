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
  isBot?: boolean; // 👈 追加
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
  const [filterBot, setFilterBot] = useState(""); // 👈 追加（BOTフィルタ）

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
    if (filterBot === "true" && !log.isBot) return false;
    if (filterBot === "false" && log.isBot) return false;
    return true;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <AdminNav />
      <h1 className="text-xl font-bold mb-4">アクセスログ</h1>

      {loading ? (
        <p>読み込み中...</p>
      ) : filteredLogs.length === 0 ? (
        <p>ログがありません</p>
      ) : (
        <div className="rounded-lg shadow-sm bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-600">
                <th className="px-4 py-3 border-b border-gray-200">Timestamp</th>
                <th className="px-4 py-3 border-b border-gray-200">IP</th>
                <th className="px-4 py-3 border-b border-gray-200">Country</th>
                <th className="px-4 py-3 border-b border-gray-200">isAdmin</th>
                <th className="px-4 py-3 border-b border-gray-200">isBot</th> {/* 👈 追加 */}
                <th className="px-4 py-3 border-b border-gray-200">UserAgent</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b border-gray-200 text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-200 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          log.blocked ? "bg-red-500" : "bg-green-500"
                        }`}
                      />
                      <span>{log.ip}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-b border-gray-200 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          log.allowedCountry ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <span>{log.country}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-b border-gray-200 text-xs text-center">
                    {log.isAdmin ? "👑" : "—"}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-200 text-xs text-center">
                    {log.isBot ? "👾" : "—"}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-200 max-w-xs truncate text-xs text-gray-500">
                    {log.userAgent}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
