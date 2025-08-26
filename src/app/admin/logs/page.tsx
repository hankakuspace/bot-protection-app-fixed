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
  timestamp?: string | null;
  createdAt?: any; // Firestore Timestamp
  clientTime?: string | null; // ISO文字列
  host?: string;
}

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

function formatFirestoreTimestamp(ts: any): string {
  if (!ts) return "-";
  try {
    return ts.toDate().toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "-";
  }
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/admin/logs");
        const data = await res.json();
        if (data.ok) {
          setLogs(data.logs);
        }
      } catch (err) {
        console.error("fetch logs error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Access Logs</h1>
      <table className="table-auto border-collapse border border-gray-400 w-full text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-2 py-1">IP</th>
            <th className="border px-2 py-1">Country</th>
            <th className="border px-2 py-1">Blocked</th>
            <th className="border px-2 py-1">isAdmin</th>
            <th className="border px-2 py-1">UserAgent</th>
            <th className="border px-2 py-1">Host</th>
            <th className="border px-2 py-1">Client Time</th>
            <th className="border px-2 py-1">Created At</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="border px-2 py-1">{log.ip}</td>
              <td className="border px-2 py-1">{log.country}</td>
              <td className="border px-2 py-1">{log.blocked ? "Yes" : "No"}</td>
              <td className="border px-2 py-1">{log.isAdmin ? "Yes" : "No"}</td>
              <td className="border px-2 py-1">{log.userAgent}</td>
              <td className="border px-2 py-1">{log.host || "-"}</td>
              <td className="border px-2 py-1">{formatDate(log.clientTime || null)}</td>
              <td className="border px-2 py-1">{formatFirestoreTimestamp(log.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
