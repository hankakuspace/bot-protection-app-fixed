'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { app } from '@/lib/firebase';

type LogRow = {
  id: string;
  timestamp?: Timestamp;
  ip?: string;
  country?: string;
  blocked?: boolean;
  isAdmin?: boolean;
  userAgent?: string;
};

const FETCH_COUNT = 500; // pull latest N then filter/paginate on client

export default function AdminLogsPage() {
  const db = getFirestore(app);

  // data & loading
  const [allRows, setAllRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filters (persist in localStorage)
  const [ipFilter, setIpFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [blockedFilter, setBlockedFilter] = useState<'all' | 'true' | 'false'>('all');

  // sort & pagination
  const [sortAsc, setSortAsc] = useState(false); // timestamp sort
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);

  // busy key for buttons
  const [busy, setBusy] = useState<string | null>(null);

  // load saved filters on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('logs.filters');
      if (raw) {
        const saved = JSON.parse(raw);
        setIpFilter(saved.ip ?? '');
        setCountryFilter(saved.country ?? '');
        setBlockedFilter(saved.blocked ?? 'all');
        setPageSize(saved.pageSize ?? 50);
        setSortAsc(saved.sortAsc ?? false);
      }
    } catch {}
  }, []);

  // save filters when changed
  useEffect(() => {
    const payload = { ip: ipFilter, country: countryFilter, blocked: blockedFilter, pageSize, sortAsc };
    localStorage.setItem('logs.filters', JSON.stringify(payload));
  }, [ipFilter, countryFilter, blockedFilter, pageSize, sortAsc]);

  // fetch latest logs
  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'access_logs'), orderBy('timestamp', 'desc'), limit(FETCH_COUNT));
      const snap = await getDocs(q);
      const rows: LogRow[] = [];
      snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));
      setAllRows(rows);
      setPage(1);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // filtering & sorting (client side)
  const filtered = useMemo(() => {
    const ipq = ipFilter.trim().toLowerCase();
    const ctq = countryFilter.trim().toUpperCase();

    let rows = allRows.filter((r) => {
      const okIp = ipq ? (r.ip ?? '').toLowerCase().includes(ipq) : true;
      const okCt = ctq ? (r.country ?? '').toUpperCase() === ctq : true;
      const okBlocked =
        blockedFilter === 'all'
          ? true
          : blockedFilter === 'true'
          ? !!r.blocked
          : !r.blocked;

      return okIp && okCt && okBlocked;
    });

    rows = rows.sort((a, b) => {
      const ta = a.timestamp?.toMillis?.() ?? 0;
      const tb = b.timestamp?.toMillis?.() ?? 0;
      return sortAsc ? ta - tb : tb - ta;
    });

    return rows;
  }, [allRows, ipFilter, countryFilter, blockedFilter, sortAsc]);

  // pagination (client-side)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const fmt = (ts?: Timestamp) =>
    ts ? new Date(ts.toMillis()).toLocaleString('en-US', { timeZone: 'UTC' }) : '-';

  // block helpers
  const clearProxyCache = async () => {
    try {
      await fetch('http://localhost:3001/admin/clear-block-cache', { method: 'POST' });
    } catch {
      // ignore if proxy endpoint is not available
    }
  };

  const blockIp = async (ip?: string) => {
    if (!ip) return;
    setBusy(`ip:${ip}`);
    try {
      await setDoc(
        doc(db, 'block_ips', ip),
        { enabled: true, note: 'added from /admin/logs', updatedAt: serverTimestamp() },
        { merge: true }
      );
      await clearProxyCache();
      alert(`Blocked IP: ${ip}`);
    } finally {
      setBusy(null);
    }
  };

  const blockCountry = async (code?: string) => {
    if (!code) return;
    setBusy(`ct:${code}`);
    try {
      await setDoc(
        doc(db, 'block_countries', code),
        { enabled: true, note: 'added from /admin/logs', updatedAt: serverTimestamp() },
        { merge: true }
      );
      await clearProxyCache();
      alert(`Blocked country: ${code}`);
    } finally {
      setBusy(null);
    }
  };

  // exports
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ['timestamp', 'ip', 'country', 'blocked', 'isAdmin', 'userAgent'];
    const lines = [headers.join(',')];
    filtered.forEach((r) => {
      const row = [
        r.timestamp?.toDate?.().toISOString?.() ?? '',
        r.ip ?? '',
        r.country ?? '',
        String(!!r.blocked),
        String(!!r.isAdmin),
        JSON.stringify(r.userAgent ?? '').replaceAll(',', ';'), // keep CSV sane
      ];
      lines.push(row.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Access Logs</h1>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-600">IP (contains)</label>
          <input
            value={ipFilter}
            onChange={(e) => setIpFilter(e.target.value)}
            className="border rounded px-2 py-1"
            placeholder="e.g. 203.0.113."
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600">Country (ISO2)</label>
          <input
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value.toUpperCase())}
            className="border rounded px-2 py-1 uppercase"
            maxLength={2}
            placeholder="JP"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600">Blocked</label>
          <select
            value={blockedFilter}
            onChange={(e) => setBlockedFilter(e.target.value as any)}
            className="border rounded px-2 py-1"
          >
            <option value="all">All</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-600">Page size</label>
          <input
            type="number"
            min={10}
            max={200}
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value) || 50);
              setPage(1);
            }}
            className="border rounded px-2 py-1 w-24"
          />
        </div>

        <button
          onClick={() => {
            setPage(1);
            reload();
          }}
          className="px-3 py-1 border rounded hover:bg-gray-50"
          disabled={loading}
          title="Reload from Firestore"
        >
          {loading ? 'Loading…' : 'Reload'}
        </button>

        <button onClick={exportCSV} className="px-3 py-1 border rounded hover:bg-gray-50">
          Export CSV
        </button>
        <button onClick={exportJSON} className="px-3 py-1 border rounded hover:bg-gray-50">
          Export JSON
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">Error: {error}</p>}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-sm border">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 border text-left w-64">
                <button
                  onClick={() => setSortAsc((v) => !v)}
                  className="inline-flex items-center gap-2"
                  title="Toggle sort by timestamp"
                >
                  <span>Timestamp (UTC)</span>
                  <span className="text-xs">{sortAsc ? '▲' : '▼'}</span>
                </button>
              </th>
              <th className="p-2 border text-left">IP</th>
              <th className="p-2 border text-left">Country</th>
              <th className="p-2 border text-left">Blocked</th>
              <th className="p-2 border text-left">Admin</th>
              <th className="p-2 border text-left">UserAgent</th>
              <th className="p-2 border text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id} className="even:bg-gray-50">
                <td className="p-2 border">{fmt(r.timestamp)}</td>

                <td className="p-2 border">
                  <div className="flex items-center gap-2">
                    <span>{r.ip ?? '-'}</span>
                  </div>
                </td>

                <td className="p-2 border">{r.country ?? '-'}</td>

                <td className="p-2 border">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      r.blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {r.blocked ? 'true' : 'false'}
                  </span>
                </td>

                <td className="p-2 border">{r.isAdmin ? 'true' : 'false'}</td>

                <td className="p-2 border">
                  <div className="max-w-[420px] truncate" title={r.userAgent}>
                    {r.userAgent ?? '-'}
                  </div>
                </td>

                <td className="p-2 border">
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="text-xs px-2 py-0.5 rounded border hover:bg-red-50 disabled:opacity-50"
                      onClick={() => blockIp(r.ip)}
                      disabled={!r.ip || busy === `ip:${r.ip}`}
                      title="Block this IP"
                    >
                      Block IP
                    </button>

                    <button
                      className="text-xs px-2 py-0.5 rounded border hover:bg-red-50 disabled:opacity-50"
                      onClick={() => blockCountry(r.country)}
                      disabled={!r.country || busy === `ct:${r.country}`}
                      title="Block this country"
                    >
                      Block Country
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {pageRows.length === 0 && !loading && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={7}>
                  No results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-gray-600">
          Showing {(page - 1) * pageSize + 1}–
          {Math.min(page * pageSize, filtered.length)} of {filtered.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Prev
          </button>
          <span className="text-sm">
            Page {page} / {totalPages}
          </span>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
