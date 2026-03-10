// src/app/admin/add-ip/page.tsx
"use client";

import { useState } from "react";

export default function AddIpPage() {
  const [ip, setIp] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    setMessage("");

    try {
      const res = await fetch("/api/ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
      });

      if (res.ok) {
        setMessage(`登録しました: ${ip}`);
        setIp("");
        return;
      }

      setMessage("登録に失敗しました");
    } catch (error) {
      console.error("add-ip page error:", error);
      setMessage("登録に失敗しました");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>IPアドレス登録</h2>
      <input
        value={ip}
        onChange={(e) => setIp(e.target.value)}
        placeholder="例: 111.222.333.444"
        style={{ marginRight: 10 }}
      />
      <button onClick={handleSubmit}>登録</button>
      <p>{message}</p>
    </div>
  );
}
