// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type VerifyResponse = {
  success?: boolean;
  blocked?: boolean;
  ip?: string;
  error?: string;
};

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ip, setIp] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      try {
        setChecking(true);
        setError("");

        const response = await fetch("/api/verify-ip", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
          cache: "no-store",
        });

        const data = (await response.json().catch(() => null)) as
          | VerifyResponse
          | null;

        if (!response.ok) {
          throw new Error(
            data?.error || `IP確認に失敗しました (${response.status})`,
          );
        }

        if (!mounted) return;

        const isBlocked = Boolean(data?.blocked);
        setBlocked(isBlocked);
        setIp(data?.ip || "");

        if (isBlocked) {
          router.replace("/blocked");
          return;
        }
      } catch (err) {
        if (!mounted) return;

        setError(
          err instanceof Error
            ? err.message
            : "IP確認中に不明なエラーが発生しました",
        );
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    };

    void verify();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>Bot Guard MAN</h1>
        <p>アクセス確認中...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem" }}>
      <nav style={{ marginBottom: "1.5rem" }}>
        <ul
          style={{
            display: "flex",
            gap: "1rem",
            listStyle: "none",
            padding: 0,
            margin: 0,
            flexWrap: "wrap",
          }}
        >
          <li>
            <a href="/admin/logs">アクセスログ</a>
          </li>
          <li>
            <a href="/admin/list-ip">ブロック設定</a>
          </li>
          <li>
            <a href="/admin/add-ip">IP追加</a>
          </li>
          <li>
            <a href="/blocked">Blockedページ</a>
          </li>
        </ul>
      </nav>

      <h1>Bot Guard MAN</h1>
      <p>
        Shopify Admin iframe 内でも、通常ブラウザ直アクセスでも表示できます。
      </p>

      <div style={{ marginTop: "1.5rem" }}>
        <p>現在IP: {ip || "-"}</p>
        <p>判定結果: {blocked ? "Blocked" : "Allowed"}</p>
        {error ? <p style={{ color: "red" }}>エラー: {error}</p> : null}
      </div>
    </main>
  );
}
