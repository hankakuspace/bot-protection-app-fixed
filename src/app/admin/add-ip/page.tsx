"use client";

import { useState } from "react";

export default function AddIpPage() {
  const [ip, setIp] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("[UI] handleSubmit called with ip =", ip);

    if (!ip.trim()) {
      alert("IPアドレスを入力してください");
      return;
    }

    try {
      const res = await fetch("/api/admin/add-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
      });

      const data = await res.json();
      console.log("[UI] API response:", data);

      if (data.ok) {
        alert(`登録成功: ${ip}`);
        setIp("");
      } else {
        alert(`エラー: ${data.error}`);
      }
    } catch (err) {
      console.error("[UI] fetch error:", err);
      alert("通信に失敗しました");
    }
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
          type="submit" // ← ここ重要
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          登録
        </button>
      </form>
    </div>
  );
}
