// src/app/admin/list-ip/page.tsx
"use client";

import { getPlanDefinition } from "@/lib/plans";
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
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

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
  const currentPlan = getPlanDefinition("free");
  const [items, setItems] = useState<IpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

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

  const handleDelete = useCallback(async (id: string, ip: string) => {
    const ok = window.confirm(`このIPを削除しますか？\n\nIP: ${ip || "-"}`);
    if (!ok) return;

    try {
      setDeletingId(id);
      setError("");

      const res = await fetch(
        `/api/admin/list-ip?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      );

      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!res.ok) {
        throw new Error(data?.error || `削除に失敗しました (${res.status})`);
      }

      setItems((prev) => prev.filter((item) => pick(item, ["id"]) !== id));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "削除中に不明なエラーが発生しました",
      );
    } finally {
      setDeletingId("");
    }
  }, []);

  const rows = useMemo(() => {
    return items.map((item, index) => {
      const sourceId = pick(item, ["id"]);
      const ip = pick(item, ["ip", "address", "value"]);
      const note = pick(item, ["note", "memo", "reason", "description"]);
      const createdAt = pick(item, ["createdAt", "timestamp", "time", "date"]);
      const createdBy = pick(item, ["createdBy", "user", "admin"]);

      return {
        id: sourceId || `${index}-${ip}-${createdAt}`,
        ip,
        note,
        createdAt,
        createdBy,
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

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-blue-800">
            <p className="text-xs font-semibold uppercase tracking-[0.14em]">
              Current Plan
            </p>
            <p className="mt-2 text-lg font-semibold">{currentPlan.name}</p>
            <p className="mt-1 text-xs leading-6">
              FreeプランではブロックIPを{currentPlan.maxBlockedIps}件まで登録できます。
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
              Registered IPs
            </p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {rows.length} / {currentPlan.maxBlockedIps}件
            </p>
            <p className="mt-1 text-xs leading-6 text-gray-500">
              上限に達している場合は、不要なIPを削除してから追加してください。
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      読み込み中...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
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
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <button
                          type="button"
                          onClick={() => void handleDelete(row.id, row.ip)}
                          disabled={!row.id || deletingId === row.id}
                          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === row.id ? "削除中..." : "削除"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
