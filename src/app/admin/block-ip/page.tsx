// src/app/admin/block-ip/page.tsx
"use client";

import { useState, useEffect } from "react";

interface BlockIp {
  id: string;
  ip: string;
  note: string;
  createdAt?: string;
}

export default function BlockIpPage() {
  const [ip, setIp] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [ips, setIps] = useState<BlockIp[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/add-ip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, note }),
    });
    const data = await res.json();
    if (data.ok) {
      setMessage("ブロックIPを登録しました");
      setIp("");
      setNote("");
      fetchIps();
    } else {
      setMessage("エラー: " + (data.error || "登録に失敗"));
    }
  };

  const fetchIps = async () => {
    const res = await fetch("/api/admin/list-ip");
    const data = await res.json();
    setIps(data);
  };

  useEffect(() => {
    fetchIps();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">ブロックIP</h1>

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
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          登録
        </button>
      </form>
      {message && <p>{message}</p>}

      {/* 一覧 */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">IP</th>
            <th className="p-2 border">Note</th>
            <th className="p-2 border">登録日</th>
          </tr>
        </thead>
        <tbody>
          {ips.map((item) => (
            <tr key={item.id}>
              <td className="p-2 border">{item.ip}</td>
              <td className="p-2 border">{item.note}</td>
              <td className="p-2 border">{item.createdAt || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
