// src/app/api/get-ip/route.ts
import { NextResponse } from 'next/server';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isAdminIp } from '@/lib/admin';
import { isIpBlocked } from '@/lib/check-ip';

/** クライアントIPを推定（X-Forwarded-For優先） */
function pickClientIp(req: Request): string {
  const xfwd = req.headers.get('x-forwarded-for');
  if (xfwd && xfwd.length > 0) {
    // "client, proxy1, proxy2" の先頭がクライアント
    return xfwd.split(',')[0].trim().replace(/^::ffff:/, '');
  }
  const real = req.headers.get('x-real-ip');
  if (real) return real.replace(/^::ffff:/, '');
  return '127.0.0.1'; // 取得できない場合はローカル想定
}

/** ローカル/プライベートIP かどうか */
function isLocalOrPrivate(ip: string) {
  if (!ip) return true;
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

/** ipinfo.ioで国コード取得 */
async function lookupCountry(ip: string): Promise<string> {
  if (!ip || isLocalOrPrivate(ip)) return 'UNKNOWN';
  try {
    const token = process.env.IPINFO_TOKEN;
    if (!token) throw new Error('IPINFO_TOKEN is not set');
    const res = await fetch(`https://ipinfo.io/${ip}?token=${token}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`ipinfo.io error: ${res.status}`);
    const data = await res.json();
    return (data && data.country) || 'UNKNOWN';
  } catch (err) {
    console.error('[ipinfo lookup error]', err);
    return 'UNKNOWN';
  }
}

/** 許可国判定（ALLOWED_COUNTRIES="JP,US" など。未設定は JP のみ許可） */
function isAllowedCountry(country: string): boolean {
  const raw = process.env.ALLOWED_COUNTRIES;
  const allowList = raw
    ? raw.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    : ['JP'];
  return !!country && allowList.includes(country.toUpperCase());
}

export async function GET(req: Request) {
  try {
    const ip = pickClientIp(req);
    const userAgent = (req.headers.get('user-agent') || '').slice(0, 1024);

    // 国コード（ローカル/プライベートは UNKNOWN のまま）
    const country = await lookupCountry(ip);

    // 管理者判定（admin_ips）
    const isAdmin = await isAdminIp(ip);

    // ブラックリスト判定（blocked_ips）
    const inBlacklist = await isIpBlocked(ip);

    // 国許可（ローカル/プライベートIPは常に許可）
    const allowedCountry = isLocalOrPrivate(ip) ? true : isAllowedCountry(country);

    // 最終ブロック判定：管理者は常に許可
    const blocked = !isAdmin && (inBlacklist || !allowedCountry);

    const now = Date.now();

    const payload = {
      status: 'ok' as const,
      ip,
      country,
      isAdmin,
      allowedCountry,
      blocked,
      userAgent,
      timestamp: now,
    };

    // アクセスログ保存（access_logs）
    await addDoc(collection(db, 'access_logs'), payload);

    return NextResponse.json(payload, { status: 200 });
  } catch (e: any) {
    console.error('[get-ip] error', e);
    return NextResponse.json(
      { status: 'error', message: e?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
