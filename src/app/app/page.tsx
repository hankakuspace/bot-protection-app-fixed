'use client';

import { useEffect, useMemo, useState } from 'react';

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_DASH_KEY || ""; // 任意。設定時はAPIに自動付与

export default function AppHome() {
  const [shop, setShop] = useState('');
  const [ips, setIps] = useState<string[]>([]);
  const [newIp, setNewIp] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const headers = useMemo(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (ADMIN_KEY) h['x-admin-key'] = ADMIN_KEY;
    return h;
  }, []);

  async function refresh() {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/ip-blocks', { headers, cache: 'no-store' });
      const json = await res.json();
      if (json.ok) setIps(json.blocked || []);
      else setMsg(json.error || 'failed to fetch');
    } finally { setBusy(false); }
  }

  async function add() {
    const ip = newIp.trim();
    if (!ip) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/ip-blocks', { method: 'POST', headers, body: JSON.stringify({ ip }) });
      const json = await res.json();
      if (json.ok) { setIps(json.blocked || []); setNewIp(''); setMsg('追加しました'); }
      else setMsg(json.error || '追加に失敗しました');
    } finally { setBusy(false); }
  }

  async function remove(ip: string) {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/ip-blocks', { method: 'DELETE', headers, body: JSON.stringify({ ip }) });
      const json = await res.json();
      if (json.ok) { setIps(json.blocked || []); setMsg('削除しました'); }
      else setMsg(json.error || '削除に失敗しました');
    } finally { setBusy(false); }
  }

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setShop((sp.get('shop') || '').toLowerCase());
    refresh();
  }, []); // eslint-disable-line

  return (
    <main className="p-6" style={{ fontFamily: 'ui-sans-serif, system-ui' }}>
      <h1 className="text-2xl font-semibold">Bot Protection — Dashboard</h1>
      <p className="text-sm opacity-70 mt-1">{shop ? <>Installed on <b>{shop}</b></> : 'Shop context not detected'}</p>

      <section className="mt-6 grid gap-4">
        <div className="rounded-xl border p-4">
          <h2 className="font-medium">Health check</h2>
          <p className="text-sm opacity-70">App Proxy 経由の疎通確認（GET/POST）</p>
          <div className="mt-3 flex gap-8">
            <a className="underline" href="https://be-search.biz/apps/bpp-20250814/ping?echo=1&cb=now" target="_blank" rel="noreferrer">
              Open GET /ping (new tab)
            </a>
            <button
              onClick={async () => {
                setBusy(true);
                try {
                  const res = await fetch('https://be-search.biz/apps/bpp-20250814/ping?cb=' + Date.now(), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ hello: 'world' })
                  });
                  setMsg(res.ok ? 'POST ok:true' : 'POST error');
                } finally { setBusy(false); }
              }}
              className="rounded-lg border px-3 py-1.5"
            >
              POST /ping を送る
            </button>
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <h2 className="font-medium">IP Blocks</h2>
          <div className="mt-3 flex gap-2">
            <input
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              placeholder="例: 203.0.113.7 / 2001:db8::1"
              className="border rounded-lg px-3 py-1.5 w-64"
            />
            <button onClick={add} className="rounded-lg border px-3 py-1.5">追加</button>
            <button onClick={refresh} className="rounded-lg border px-3 py-1.5">更新</button>
            {busy && <span className="text-sm opacity-70">処理中...</span>}
            {msg && <span className="text-sm opacity-70">{msg}</span>}
          </div>

          <ul className="mt-4 grid gap-2">
            {ips.length === 0 && <li className="text-sm opacity-60">（まだ登録なし）</li>}
            {ips.map(ip => (
              <li key={ip} className="flex items-center justify-between border rounded-lg px-3 py-1.5">
                <span>{ip}</span>
                <button onClick={() => remove(ip)} className="text-red-600 underline">削除</button>
              </li>
            ))}
          </ul>
          <p className="text-xs opacity-60 mt-3">
            ※ 現状は簡易 JSON 保存（/tmp）。本番永続化は後ほど Vercel Blob 等に置き換え可能。
          </p>
        </div>
      </section>
    </main>
  );
}
