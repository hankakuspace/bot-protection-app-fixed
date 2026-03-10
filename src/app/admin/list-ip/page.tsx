// src/app/admin/list-ip/page.tsx
"use client";

import { useEffect, useState } from "react";

export default function ListIpPage() {
  const [ips, setIps] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/ip", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("failed to fetch ip list");
        }

        const data = await res.json();
        setIps(Array.isArray(data.ips) ? data.ips : []);
      } catch (err) {
        console.error("list-ip page error:", err);
        setError("IP一覧の取得に失敗しました");
      }
    })();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>登録済みIP一覧</h2>

      {error ? <p style={{ color: "red" }}>{error}</p> : null}

      {ips.length === 0 ? (
        <p>登録済みIPはありません</p>
      ) : (
        <ul>
          {ips.map((ip, i) => (
            <li key={`${ip}-${i}`}>{ip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
