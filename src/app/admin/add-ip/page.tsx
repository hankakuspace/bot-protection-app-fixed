"use client";

import { useState } from "react";

export default function AddIpPage() {
  const [ip, setIp] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/add-ip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip }),
    });
    const data = await res.json();
    alert(data.ok ? `登録成功: ${ip}` : `エラー: ${data.error}`);
    setIp("");
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">IP 登録</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="IPアドレス"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          登録
        </button>
      </form>
    </div>
  );
}
