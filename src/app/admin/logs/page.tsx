// src/app/admin/logs/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  startAt,
  where,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import IpActions from './IpActions';
import AdminToggle from './AdminToggle';

type LogRow = {
  ip: string;
  country?: string;
  allowedCountry?: boolean;
  blocked?: boolean;
  isAdmin?: boolean;
  userAgent?: string;
  timestamp: number;
};

/* --- 小さなボタン（色・アイコンつき） --- */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: string;
  variant?: 'primary' | 'success' | 'muted' | 'warning' | 'danger' | 'indigo' | 'slate';
  active?: boolean;
};
function ToolbarButton({ icon, children, variant = 'muted', active, className = '', ...rest }: BtnProps) {
  const base = 'inline-flex items-center gap-1 rounded-md px-3 py-1 text-sm transition-colors border';
  const scheme: Record<NonNullable<BtnProps['variant']>, string> = {
    primary: 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700',
    success: active
      ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
      : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50',
    muted: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50',
    warning: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200',
    danger: 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200',
    indigo: 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700',
    slate: 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200',
  };
  return (
    <button className={`${base} ${scheme[variant]} ${className}`} {...rest}>
      {icon ? <span aria-hidden>{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}

export default function LogsPage() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ページネーション
  const [page, setPage] = useState(1);
  const [firstDoc, setFirstDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [cursors, setCursors] = useState<
    { page: number; first: QueryDocumentSnapshot<DocumentData> | null; last: QueryDocumentSnapshot<DocumentData> | null }[]
  >([]);

  // 件数セレクタ
  const [pageSize, setPageSize] = useState<number>(20);

  // フィルタ
  const [filterCountry, setFilterCountry] = useState('');
  const [filterIsAdmin, setFilterIsAdmin] = useState<'all' | 'true' | 'false'>('all');
  const [filterBlocked, setFilterBlocked] = useState<'all' | 'true' | 'false'>('all');

  // 並び順（初期：降順＝新しい順）
  const [sortAsc, setSortAsc] = useState(false);

  // リアルタイム購読トグル
  const [live, setLive] = useState(false);

  const hasPrev = page > 1;
  const hasNext = rows.length === pageSize;

  const buildBaseQuery = () => {
    let qBase = query(collection(db, 'access_logs'), orderBy('timestamp', sortAsc ? 'asc' : 'desc'));
    if (filterCountry.trim()) qBase = query(qBase, where('country', '==', filterCountry.trim()));
    if (filterIsAdmin !== 'all') qBase = query(qBase, where('isAdmin', '==', filterIsAdmin === 'true'));
    if (filterBlocked !== 'all') qBase = query(qBase, where('blocked', '==', filterBlocked === 'true'));
    return qBase;
  };

  // 非Live時の読み込み
  const loadPage = async (opts?: { direction?: 'init' | 'next' | 'prev' }) => {
    setLoading(true);
    setError(null);
    try {
      const dir = opts?.direction ?? 'init';
      let qBase = buildBaseQuery();

      if (dir === 'next' && lastDoc) qBase = query(qBase, startAfter(lastDoc));
      else if (dir === 'prev') {
        const prev = cursors.find((c) => c.page === page - 1);
        if (prev?.first) qBase = query(qBase, startAt(prev.first));
      }

      const snap = await getDocs(query(qBase, limit(pageSize)));
      const docs = snap.docs;

      const data: LogRow[] = docs.map((d) => {
        const v: any = d.data();
        const ts =
          typeof v.timestamp === 'number' ? v.timestamp : v.timestamp?.toMillis ? v.timestamp.toMillis() : 0;
        return {
          ip: v.ip,
          country: v.country,
          allowedCountry: v.allowedCountry,
          blocked: v.blocked,
          isAdmin: v.isAdmin,
          userAgent: v.userAgent,
          timestamp: ts,
        };
      });

      setRows(data);
      setFirstDoc(docs[0] ?? null);
      setLastDoc(docs[docs.length - 1] ?? null);

      if (dir === 'init') {
        setPage(1);
        setCursors([{ page: 1, first: docs[0] ?? null, last: docs[docs.length - 1] ?? null }]);
      } else if (dir === 'next') {
        const newPage = page + 1;
        setPage(newPage);
        setCursors((prev) =>
          prev.find((p) => p.page === newPage)
            ? prev
            : [...prev, { page: newPage, first: docs[0] ?? null, last: docs[docs.length - 1] ?? null }]
        );
      } else if (dir === 'prev') {
        setPage((p) => Math.max(1, p - 1));
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  // Live購読（1ページ分）
  useEffect(() => {
    if (!live) return;
    setPage(1);
    const unsub = onSnapshot(
      query(buildBaseQuery(), limit(pageSize)),
      (snap) => {
        const docs = snap.docs;
        const data: LogRow[] = docs.map((d) => {
          const v: any = d.data();
          const ts =
            typeof v.timestamp === 'number' ? v.timestamp : v.timestamp?.toMillis ? v.timestamp.toMillis() : 0;
          return {
            ip: v.ip,
            country: v.country,
            allowedCountry: v.allowedCountry,
            blocked: v.blocked,
            isAdmin: v.isAdmin,
            userAgent: v.userAgent,
            timestamp: ts,
          };
        });
        setRows(data);
        setFirstDoc(docs[0] ?? null);
        setLastDoc(docs[docs.length - 1] ?? null);
        setCursors([{ page: 1, first: docs[0] ?? null, last: docs[docs.length - 1] ?? null }]);
      },
      (err) => {
        console.error('[logs live] onSnapshot error:', err);
        setError(err?.message || 'Live update failed');
      }
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, filterCountry, filterIsAdmin, filterBlocked, sortAsc, pageSize]);

  // フィルタ/ソート/件数変更時（非Live）
  useEffect(() => {
    if (live) return;
    loadPage({ direction: 'init' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCountry, filterIsAdmin, filterBlocked, sortAsc, pageSize, live]);

  const onClickNext = () => {
    if (!hasNext || live) return;
    loadPage({ direction: 'next' });
  };
  const onClickPrev = () => {
    if (!hasPrev || live) return;
    loadPage({ direction: 'prev' });
  };

  // Export
  const downloadText = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const handleExportJSON = () =>
    downloadText(`access_logs_page${page}${live ? '_live' : ''}.json`, JSON.stringify(rows, null, 2));
  const toCsvValue = (v: unknown) => `"${(v ?? '').toString().replace(/"/g, '""')}"`;
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'IP', 'Country', 'AllowedCountry', 'isAdmin', 'blocked (at log)', 'UA'];
    const lines = [headers.map(toCsvValue).join(',')];
    rows.forEach((r) =>
      lines.push(
        [
          r.timestamp ? new Date(r.timestamp).toISOString() : '',
          r.ip,
          r.country ?? '',
          r.allowedCountry === undefined ? '' : String(r.allowedCountry),
          r.isAdmin === undefined ? '' : String(r.isAdmin),
          r.blocked === undefined ? '' : String(r.blocked),
          r.userAgent ?? '',
        ]
          .map(toCsvValue)
          .join(',')
      )
    );
    downloadText(`access_logs_page${page}${live ? '_live' : ''}.csv`, lines.join('\n'));
  };

  const header = useMemo(
    () => (
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h1 className="text-xl font-bold">Access Logs</h1>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Admin IPs への導線 */}
          <Link
            href="/admin/admin-ips"
            className="inline-flex items-center gap-1 rounded-md px-3 py-1 text-sm bg-violet-600 text-white border border-violet-600 hover:bg-violet-700"
            title="管理者IPの追加・削除"
          >
            🧑‍💼 Admin IPs
          </Link>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <label className="text-sm opacity-70">Country</label>
            <input
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              placeholder="JP など"
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm opacity-70">isAdmin</label>
            <select
              value={filterIsAdmin}
              onChange={(e) => setFilterIsAdmin(e.target.value as any)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">all</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm opacity-70">blocked</label>
            <select
              value={filterBlocked}
              onChange={(e) => setFilterBlocked(e.target.value as any)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">all</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </div>

          {/* 件数セレクタ */}
          <div className="flex items-center gap-2">
            <label className="text-sm opacity-70">Rows</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
              title="1ページの表示件数"
            >
              <option value={20}>20</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>

          {/* Live toggle */}
          <ToolbarButton
            icon={live ? '🟢' : '⚪️'}
            variant="success"
            active={live}
            onClick={() => setLive((p) => !p)}
            title="Liveモード（リアルタイム購読）"
          >
            Live: {live ? 'On' : 'Off'}
          </ToolbarButton>

          {/* Reload */}
          <ToolbarButton
            icon="🔄"
            variant="primary"
            onClick={() => loadPage({ direction: 'init' })}
            disabled={loading || live}
            title={live ? 'Live中は無効' : '再読み込み'}
          >
            Reload
          </ToolbarButton>

          {/* Export */}
          <ToolbarButton icon="📄" variant="slate" onClick={handleExportCSV} disabled={rows.length === 0}>
            Export CSV
          </ToolbarButton>
          <ToolbarButton icon="🧩" variant="slate" onClick={handleExportJSON} disabled={rows.length === 0}>
            Export JSON
          </ToolbarButton>
        </div>
      </div>
    ),
    [filterCountry, filterIsAdmin, filterBlocked, pageSize, live, loading, rows.length]
  );

  return (
    <div className="p-6">
      {header}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th
                className="text-left p-2 cursor-pointer select-none"
                onClick={() => setSortAsc((p) => !p)}
                title="クリックで昇順/降順を切替"
              >
                Timestamp {sortAsc ? '▲' : '▼'}
              </th>
              <th className="text-left p-2">IP</th>
              <th className="text-left p-2">Country</th>
              <th className="text-left p-2">AllowedCountry</th>
              <th className="text-left p-2">isAdmin</th>
              <th className="text-left p-2">blocked (at log)</th>
              <th className="text-left p-2">UA</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.ip}-${r.timestamp}`} className="border-b align-top">
                <td className="p-2">{r.timestamp ? new Date(r.timestamp).toLocaleString() : '-'}</td>
                <td className="p-2">{r.ip}</td>
                <td className="p-2">{r.country ?? '-'}</td>
                <td className="p-2">{r.allowedCountry === undefined ? '-' : String(r.allowedCountry)}</td>
                <td className="p-2">{r.isAdmin === undefined ? '-' : String(r.isAdmin)}</td>
                <td className="p-2">{r.blocked === undefined ? '-' : String(r.blocked)}</td>
                <td className="p-2 truncate max-w-[360px]">{r.userAgent ?? '-'}</td>
                <td className="p-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <IpActions
                      ip={r.ip}
                      initialBlocked={Boolean(r.blocked)}
                      onChange={(b) => {
                        setRows((prev) =>
                          prev.map((x) =>
                            x.ip === r.ip && x.timestamp === r.timestamp ? { ...x, blocked: b } : x
                          )
                        );
                      }}
                    />
                    <AdminToggle
                      ip={r.ip}
                      initialIsAdmin={Boolean(r.isAdmin)}
                      onChange={(isAdmin) => {
                        setRows((prev) => prev.map((x) => (x.ip === r.ip ? { ...x, isAdmin } : x)));
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center opacity-70">
                  No logs
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {error && <div className="mt-3 text-sm text-red-600">Error: {error}</div>}
      {loading && <div className="mt-3 text-sm opacity-70">Loading…</div>}

      <div className="mt-4 flex items-center gap-2">
        <ToolbarButton onClick={onClickPrev} disabled={!hasPrev || loading || live}>
          ◀ Prev
        </ToolbarButton>
        <span className="text-sm">
          Page {page}
          {live ? ' (Live)' : ''}
        </span>
        <ToolbarButton onClick={onClickNext} disabled={!hasNext || loading || live}>
          Next ▶
        </ToolbarButton>
      </div>
    </div>
  );
}
