// src/app/admin/logs/page.tsx
"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Code, Download } from "lucide-react";

interface AccessLog {
  id: string;
  ip: string;
  country: string;
  allowedCountry?: boolean;
  blocked?: boolean;
  isAdmin?: boolean;
  userAgent?: string;
  isBot?: boolean;
  timestamp: string | null;
}

export default function LogsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // フィルタ state
  const [filterCountry, setFilterCountry] = useState("");
  const [filterBlocked, setFilterBlocked] = useState("");
  const [filterAdmin, setFilterAdmin] = useState("");

  const fetchLogs = async (
    from: string,
    to: string,
    offset: number,
    append = false
  ) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await fetch(
        `/api/admin/logs?from=${from}&to=${to}&offset=${offset}&limit=100`
      );
      const data = await res.json();
      const newLogs: AccessLog[] = data.logs || [];

      if (append) setLogs((prev) => [...prev, ...newLogs]);
      else setLogs(newLogs);

      setHasMore(newLogs.length === 100);
    } catch (e) {
      console.error("ログ取得失敗:", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    fetchLogs(fromDate, toDate, 0, false);
  }, [fromDate, toDate]);

  const formatDate = (iso: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}/${String(d.getDate()).padStart(2, "0")} ${String(
      d.getHours()
    ).padStart(2, "0")}:${String(d.getMinutes()).padStart(
      2,
      "0"
    )}:${String(d.getSeconds()).padStart(2, "0")}`;
  };

  const filteredLogs = logs.filter((log) => {
    if (filterCountry && log.country !== filterCountry) return false;
    if (filterBlocked === "true" && !log.blocked) return false;
    if (filterBlocked === "false" && log.blocked) return false;
    if (filterAdmin === "true" && !log.isAdmin) return false;
    if (filterAdmin === "false" && log.isAdmin) return false;
    return true;
  });

  // JSONダウンロード
  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs_${fromDate}_${toDate}.json`;
    a.click();
  };

  // CSVダウンロード
  const handleDownloadCsv = () => {
    const header = [
      "timestamp",
      "ip",
      "country",
      "blocked",
      "allowedCountry",
      "isAdmin",
      "isBot",
      "userAgent",
    ];
    const rows = filteredLogs.map((l) =>
      [
        l.timestamp,
        l.ip,
        l.country,
        l.blocked,
        l.allowedCountry,
        l.isAdmin,
        l.isBot,
        `"${(l.userAgent || "").replace(/"/g, '""')}"`,
      ].join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs_${fromDate}_${toDate}.csv`;
    a.click();
  };

  // 国リスト作成
  const countryOptions = Array.from(new Set(logs.map((l) => l.country))).filter(
    Boolean
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-xl font-bold mb-4">アクセスログ</h1>

      {/* 日付 + Reload + JSON/CSV */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
        <span>〜</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />

        <button
          onClick={() => {
            setOffset(0);
            fetchLogs(fromDate, toDate, 0, false);
          }}
          className="flex items-center gap-1 px-3 py-1 border rounded bg-white hover:bg-gray-100 text-sm"
        >
          <RefreshCw size={14} className="text-gray-600" />
          Reload
        </button>

        <button
          onClick={handleDownloadJson}
          className="flex items-center gap-1 px-3 py-1 border rounded bg-white hover:bg-gray-100 text-sm"
        >
          <Code size={14} className="text-gray-600" />
          JSON
        </button>

        <button
          onClick={handleDownloadCsv}
          className="flex items-center gap-1 px-3 py-1 border rounded bg-white hover:bg-gray-100 text-sm"
        >
          <Download size={14} className="text-gray-600" />
          CSV
        </button>
      </div>

      {/* フィルタ */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <select
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">全ての国</option>
          {countryOptions.map((c) => (
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
          <option value="">Blocked/Allowed 全て</option>
          <option value="true">Blocked のみ</option>
          <option value="false">Allowed のみ</option>
        </select>

        <select
          value={filterAdmin}
          onChange={(e) => setFilterAdmin(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">管理者/非管理者 全て</option>
          <option value="true">管理者のみ</option>
          <option value="false">非管理者のみ</option>
        </select>
      </div>

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
                      {log.isAdmin ? (
                        // 管理者IPは青だけ
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                      ) : (
                        // 通常IPは赤/緑
                        <span
                          className={`w-2 h-2 rounded-full ${
                            log.blocked ? "bg-red-500" : "bg-green-500"
                          }`}
                        />
                      )}
                      <span>{log.ip}</span>
                      {log.isBot && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded bg-orange-100 text-orange-700">
                          BOT
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 border-b border-gray-200 text-xs">
                    <span>{log.country}</span>
                  </td>
                  <td className="px-4 py-3 border-b border-gray-200 max-w-xs truncate text-xs text-gray-500">
                    {log.userAgent}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Load More */}
          <div className="flex justify-center py-4">
            {hasMore ? (
              <button
                onClick={() => {
                  const newOffset = offset + 100;
                  setOffset(newOffset);
                  fetchLogs(fromDate, toDate, newOffset, true);
                }}
                disabled={loadingMore}
                className="px-6 py-2 border rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            ) : (
              <p className="text-sm text-gray-500">
                No more logs to show within selected timeline
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
