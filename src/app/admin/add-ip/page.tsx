// src/app/admin/add-ip/page.tsx
"use client";

import { FormEvent, useMemo, useState } from "react";

type SubmitResult = {
  ok: boolean;
  message: string;
  raw: string;
};

function isValidIpv4(ip: string): boolean {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    if (!/^\d+$/.test(part)) return false;
    const num = Number(part);
    return num >= 0 && num <= 255;
  });
}

export default function AdminAddIpPage() {
  const [ip, setIp] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const trimmedIp = useMemo(() => ip.trim(), [ip]);
  const canSubmit = trimmedIp.length > 0 && !submitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const targetIp = trimmedIp;

    if (!targetIp) {
      setResult({
        ok: false,
        message: "IPアドレスを入力してください。",
        raw: "",
      });
      return;
    }

    if (!isValidIpv4(targetIp)) {
      setResult({
        ok: false,
        message: "IPv4形式で入力してください。例: 192.168.0.1",
        raw: "",
      });
      return;
    }

    try {
      setSubmitting(true);
      setResult(null);

      const res = await fetch("/api/admin/add-ip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ip: targetIp,
          note: note.trim(),
        }),
      });

      const text = await res.text();

      let parsed: unknown = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = text;
      }

      if (!res.ok) {
        const message =
          typeof parsed === "object" &&
          parsed !== null &&
          "error" in (parsed as Record<string, unknown>)
            ? String((parsed as Record<string, unknown>).error)
            : `IP追加に失敗しました (${res.status})`;

        setResult({
          ok: false,
          message,
          raw: text,
        });
        return;
      }

      setResult({
        ok: true,
        message: "IPを登録しました。",
        raw: text,
      });

      setIp("");
      setNote("");
    } catch (err) {
      setResult({
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : "登録中に不明なエラーが発生しました。",
        raw: "",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500">Admin</p>
          <h1 className="text-3xl font-bold tracking-tight">ブロックIP追加</h1>
          <p className="mt-2 text-sm text-gray-600">
            `/api/admin/add-ip` に POST します。直アクセス時でも App Bridge
            なしで動作する画面です。
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="ip"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                IPアドレス
              </label>
              <input
                id="ip"
                name="ip"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="例: 192.168.0.1"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="note"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                メモ
              </label>
              <textarea
                id="note"
                name="note"
                rows={4}
                placeholder="登録理由など"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-500"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "登録中..." : "IPを登録"}
              </button>

              <a
                href="/admin/list-ip"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
              >
                IP一覧を見る
              </a>
            </div>
          </form>
        </div>

        {result ? (
          <div
            className={`mt-6 rounded-2xl border p-5 shadow-sm ${
              result.ok
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <p className="text-sm font-semibold">{result.message}</p>

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide">
                Response
              </p>
              <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap break-all rounded-xl bg-white/70 p-4 text-xs">
                {result.raw || "(empty)"}
              </pre>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
