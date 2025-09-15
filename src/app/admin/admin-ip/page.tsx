// src/app/admin/add-admin-ip/page.tsx
"use client";

import { useState } from "react";

export default function AddAdminIpPage() {
  const [ip, setIp] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("/api/admin/add-admin-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, note }),
      });

      const data = await res.json();
      if (data.ok) {
        setMessage("管理者IPを登録しました");
        setIp("");
        setNote("");
      } else {
        setMessage(data.error || "登録に失敗しました");
      }
    } catch (err) {
      console.error(err);
      setMessage("エラーが発生しました");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">管理者IP登録</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
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
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
