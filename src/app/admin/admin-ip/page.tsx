// src/app/admin/admin-ip/page.tsx
"use client";

import { useState, useEffect } from "react";

interface AdminIp {
  id: string;
  ip: string;
  note: string;
  createdAt?: string;
}

export default function AdminIpPage() {
  const [ip, setIp] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [ips, setIps] = useState<AdminIp[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("/api/admin/admin-ip/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, note }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage("管理者IPを登録しました");
        setIp("");
        setNote("");
        fetchIps();
      } else {
        setMessage(data.error || "登録に失敗しました");
      }
    } catch (err) {
      console.error("管理者IP登録エラー:", err);
      setMessage("エラーが発生しました");
    }
  };

  const fetchIps = async () => {
    try {
      const res = await fetch("/api/admin/admin-ip/list");
      const data = await res.json();
      setIps(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("管理者IP一覧取得エラー:", err);
      setIps([]);
    }
  };

  useEffect(() => {
    fetchIps();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">管理者IP</h1>

      {/* 追加フォーム */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <input
          type="text"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="例: 192.168.0.1"
          className="border rounded p-2 w-full"
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="メモ（任意）"
          className="border rounded p-2 w-full"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          登録
        </button>
      </form>
      {message && <p>{message}</p>}

      {/* 一覧テーブル */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">IP</th>
            <th className="p-2 border">Note</th>
            <th className="p-2 border">登録日</th>
          </tr>
        </thead>
        <tbody>
          {ips.length === 0 ? (
            <tr>
              <td colSpan={3} className="p-4 text-center text-gray-500">
                登録された管理者IPはありません
              </td>
            </tr>
          ) : (
            ips.map((item) => (
              <tr key={item.id}>
                <td className="p-2 border">{item.ip}</td>
                <td className="p-2 border">{item.note}</td>
                <td className="p-2 border">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString("ja-JP")
                    : "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
