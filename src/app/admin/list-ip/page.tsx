// src/app/admin/list-ip/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type IpItem = Record<string, unknown>;

function normalizeList(data: unknown): IpItem[] {
  if (Array.isArray(data)) return data as IpItem[];

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.ips)) return obj.ips as IpItem[];
    if (Array.isArray(obj.items)) return obj.items as IpItem[];
    if (Array.isArray(obj.data)) return obj.data as IpItem[];
  }

  return [];
}

function text(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function pick(obj: IpItem, keys: string[]): string {
  for (const key of keys) {
    if (key in obj) {
      const v = text(obj[key]);
      if (v) return v;
    }
  }
  return "";
}

export default function AdminListIpPage() {
  const [items, setItems] = useState<IpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [raw, setRaw] = useState("");

  const fetchList = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const res = await fetch("/api/admin/list-ip", {
        method: "GET",
        cache: "no-store",
      });

      const body = await res.text();
      setRaw(body);

      let parsed: unknown = null;
      try {
        parsed = body ? JSON.parse(body) : null;
      } catch {
        parsed = body;
      }

      if (!res.ok) {
        throw new Error(
          typeof parsed === "object" &&
            parsed !== null &&
            "error" in (parsed as Record<string, unknown>)
            ? String((parsed as Record<string, unknown>).error)
            : `IP一覧の取得に失敗しました (${res.status})`,
        );
      }

      setItems(normalizeList(parsed));
    } catch (err) {
      setItems([]);
      setError(
        err instanceof Error
          ? err.message
          : "IP一覧の取得中に不明なエラーが発生しました",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchList(false);
  }, [fetchList]);

  const rows = useMemo(() => {
    return items.map((item, index) => {
      const ip = pick(item, ["ip", "address", "value"]);
      const note = pick(item, ["note", "memo", "reason", "description"]);
      const createdAt = pick(item, ["createdAt", "timestamp", "time", "date"]);
      const createdBy = pick(item, ["createdBy", "user", "admin"]);

      return {
        id: `${index}-${ip}-${createdAt}`,
        ip,
        note,
        createdAt,
        createdBy,
        raw: text(item),
      };
    });
  }, [items]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Admin</p>
            <h1 className="text-3xl font-bold tracking-tight">
              ブロックIP一覧
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              `/api/admin/list-ip`
              の返却形式に差異があっても表示が落ちないようにしています。
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchList(true)}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading || refreshing}
          >
            {refreshing ? "更新中..." : "再読み込み"}
          </button>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">登録件数</p>
            <p className="mt-2 text-2xl font-bold">{rows.length}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">読込状態</p>
            <p className="mt-2 text-2xl font-bold">
              {loading ? "Loading" : "Ready"}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">API</p>
            <p className="mt-2 text-sm font-semibold text-gray-800">
              /api/admin/list-ip
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    IP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Note
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Created At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Created By
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      読み込み中...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      登録されたIPがありません
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-gray-100 align-top"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {row.ip || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.note || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.createdAt || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.createdBy || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-gray-800">
            API 生レスポンス
          </p>
          <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-all rounded-xl bg-gray-50 p-4 text-xs text-gray-700">
            {raw || "(empty)"}
          </pre>
        </div>
      </div>
    </main>
  );
}
