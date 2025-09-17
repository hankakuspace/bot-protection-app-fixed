// src/app/admin/logs/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  RefreshCw,
  Code,
  Download,
  ChevronDown,
  Check,
} from "lucide-react";
import * as ipaddr from "ipaddr.js";

interface AccessLog {
  id: string;
  ip: string;
  country: string;
  allowedCountry?: boolean;
  blocked?: boolean | string;
  userAgent?: string;
  isBot?: boolean;
  logTimestamp?: string | null;
}

export default function LogsPage() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const today = jst.toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [adminIps, setAdminIps] = useState<string[]>([]);
  const [blockedIps, setBlockedIps] = useState<string[]>([]);

  const [ipFilter, setIpFilter] = useState<string>("ALL");
  const [countryFilter, setCountryFilter] = useState<string>("ALL");
  const [ipMenuOpen, setIpMenuOpen] = useState(false);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);

  const ipMenuRef = useRef<HTMLDivElement>(null);
  const countryMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ipMenuRef.current && !ipMenuRef.current.contains(e.target as Node)) {
        setIpMenuOpen(false);
      }
      if (countryMenuRef.current && !countryMenuRef.current.contains(e.target as Node)) {
        setCountryMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchAdminIps = async () => {
    try {
      const res = await fetch("/api/admin/admin-ip/list");
      const data = await res.json();
      const ips: string[] = (data || []).map((d: any) => d.ip);
      setAdminIps(ips);
    } catch (e) {
      console.error("管理者IP取得失敗:", e);
    }
  };

  const fetchBlockedIps = async () => {
    try {
      const res = await fetch("/api/admin/block-ip/list");
      const data = await res.json();
      const ips: string[] = (data || []).map((d: any) => d.ip);
      setBlockedIps(ips);
    } catch (e) {
      console.error("ブロックIP取得失敗:", e);
    }
  };

  const fetchLogs = async (from: string, to: string, offset: number, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/admin/logs?from=${from}&to=${to}&offset=${offset}&limit=100`);
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
    fetchAdminIps();
    fetchBlockedIps();
  }, [fromDate, toDate]);

  const formatDate = (iso: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
      d.getDate()
    ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  };

  const isDynamicAdmin = (ip: string): boolean => {
    try {
      const parsedIp = ipaddr.parse(ip);
      return adminIps.some((adminIp) => {
        if (adminIp.includes("/")) {
          const range = ipaddr.parseCIDR(adminIp);
          return parsedIp.match(range);
        } else {
          return ip === adminIp;
        }
      });
    } catch {
      return false;
    }
  };

  const isDynamicBlocked = (ip: string): boolean => {
    try {
      const parsedIp = ipaddr.parse(ip);
      return blockedIps.some((blockedIp) => {
        if (blockedIp.includes("/")) {
          const range = ipaddr.parseCIDR(blockedIp);
          return parsedIp.match(range);
        } else {
          return ip === blockedIp;
        }
      });
    } catch {
      return false;
    }
  };

  const countryOptions = Array.from(new Set(logs.map((l) => l.country))).filter(Boolean);

  const filteredLogs = logs.filter((log) => {
    const dynamicIsAdmin = isDynamicAdmin(log.ip);
    const dynamicIsBlocked = isDynamicBlocked(log.ip);

    if (ipFilter === "ADMIN" && !dynamicIsAdmin) return false;
    if (ipFilter === "BLOCKED" && !dynamicIsBlocked) return false;
    if (ipFilter === "ALLOWED" && (dynamicIsAdmin || dynamicIsBlocked)) return false;

    if (countryFilter !== "ALL" && log.country !== countryFilter) return false;

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
      "logTimestamp",
      "ip",
      "country",
      "blocked(dynamic)",
      "allowedCountry",
      "isAdmin(dynamic)",
      "isBot",
      "userAgent",
    ];
    const rows = filteredLogs.map((l) =>
      [
        l.logTimestamp,
        l.ip,
        l.country,
        isDynamicBlocked(l.ip),
        l.allowedCountry,
        isDynamicAdmin(l.ip),
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

  const MenuItem = ({
    label,
    active,
    onClick,
    color,
  }: {
    label: string;
    active?: boolean;
    onClick: () => void;
    color?: string;
  }) => (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full px-3 py-2 text-sm font-normal rounded-md hover:bg-gray-100"
    >
      <div className="flex items-center gap-2">
        {color && <span className={`w-2 h-2 rounded-full ${color}`} />}
        {label}
      </div>
      {active && <Check size={14} className="text-gray-600" />}
    </button>
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
            fetchAdminIps();
            fetchBlockedIps();
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

      {loading ? (
        <p>読み込み中...</p>
      ) : filteredLogs.length === 0 ? (
        <p>ログがありません</p>
      ) : (
        <div className="rounded-lg shadow-sm bg-white">
          <table className="w-full border-collapse text-sm relative">
            <thead>
              <tr className="bg-gray-100 text-center text-xs font-semibold text-gray-600">
                <th className="px-4 py-3 border-b border-gray-200">LogTimestamp</th>

                {/* IP フィルタ */}
                <th className="px-4 py-3 border-b border-gray-200 relative">
                  <div
                    ref={ipMenuRef}
                    className="flex justify-center items-center relative cursor-pointer"
                    onClick={() => setIpMenuOpen((o) => !o)}
                  >
                    <span>IP</span>
                    <ChevronDown size={14} className="ml-1" />
                    {ipMenuOpen && (
                      <div className="absolute top-full mt-1 bg-white border rounded-lg shadow-lg z-10 p-1 w-40 text-left">
                        <MenuItem
                          label="ALL"
                          active={ipFilter === "ALL"}
                          onClick={() => setIpFilter("ALL")}
                        />
                        <MenuItem
                          label="管理者"
                          color="bg-blue-500"
                          active={ipFilter === "ADMIN"}
                          onClick={() => setIpFilter("ADMIN")}
                        />
                        <MenuItem
                          label="正常"
                          color="bg-green-500"
                          active={ipFilter === "ALLOWED"}
                          onClick={() => setIpFilter("ALLOWED")}
                        />
                        <MenuItem
                          label="ブロック"
                          color="bg-red-500"
                          active={ipFilter === "BLOCKED"}
                          onClick={() => setIpFilter("BLOCKED")}
                        />
                      </div>
                    )}
                  </div>
                </th>

                {/* Country フィルタ */}
                <th className="px-4 py-3 border-b border-gray-200 relative">
                  <div
                    ref={countryMenuRef}
                    className="flex justify-center items-center relative cursor-pointer"
                    onClick={() => setCountryMenuOpen((o) => !o)}
                  >
                    <span>Country</span>
                    <ChevronDown size={14} className="ml-1" />
                    {countryMenuOpen && (
                      <div className="absolute top-full mt-1 bg-white border rounded-lg shadow-lg z-10 p-1 w-40 text-left">
                        <MenuItem
                          label="ALL"
                          active={countryFilter === "ALL"}
                          onClick={() => setCountryFilter("ALL")}
                        />
                        {countryOptions.map((c) => (
                          <MenuItem
                            key={c}
                            label={c}
                            active={countryFilter === c}
                            onClick={() => setCountryFilter(c)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </th>

                <th className="px-4 py-3 border-b border-gray-200">UserAgent</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const dynamicIsAdmin = isDynamicAdmin(log.ip);
                const dynamicIsBlocked = isDynamicBlocked(log.ip);
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border-b border-gray-200 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(log.logTimestamp || null)}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        {dynamicIsAdmin ? (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        ) : dynamicIsBlocked ? (
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-green-500" />
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
                );
              })}
            </tbody>
          </table>

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
