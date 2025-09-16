// src/app/admin/logs/page.tsx
"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Code, Download } from "lucide-react";

interface AccessLog {
  id: string;
  ip: string;
  country: string;
  allowedCountry?: boolean;
  blocked?: boolean | string;
  isAdmin?: boolean | string;
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

  const countryOptions = Array.from(new Set(logs.map((l) => l.country))).filter(
    Boolean
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-xl font-bold mb-4">アクセスログ</h1>

      {/* 日付 + Reload + JSON/CSV */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* ... 日付やボタン部分は省略 ... */}
      </div>

      {/* フィルタ */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        {/* ... フィルタ部分も省略 ... */}
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
                      {log.isAdmin === true || log.isAdmin === "true" ? (
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                      ) : (
                        <span
                          className={`w-2 h-2 rounded-full ${
                            log.blocked === true || log.blocked === "true"
                              ? "bg-red-500"
                              : "bg-green-500"
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
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          log.allowedCountry === false
                            ? "bg-red-500"
                            : "bg-green-500"
                        }`}
                      />
                      <span>{log.country}</span>
                    </div>
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
