import { NextResponse } from 'next/server';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isAdminIp } from '@/lib/admin';
import { isIpBlocked } from '@/lib/check-ip';

// ★ Node実行を明示（EdgeでFirebase等が落ちるのを予防）
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // 常にSSR

function pickClientIp(req: Request): string {
  const xfwd = req.headers.get('x-forwarded-for');
  if (xfwd) return xfwd.split(',')[0].trim().replace(/^::ffff:/, '');
  const real = req.headers.get('x-real-ip');
  if (real) return real.replace(/^::ffff:/, '');
  return '127.0.0.1';
}

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

async function lookupCountry(ip: string): Promise<string> {
  if (!ip || isLocalOrPrivate(ip)) return 'UNKNOWN';
  try {
    const token = process.env.IPINFO_TOKEN;
    if (!token) return 'UNKNOWN';
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 3500); // 3.5sでタイムアウト
    const res = await fetch(`https://ipinfo.io/${ip}?token=${token}`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) return 'UNKNOWN';
    const data = await res.json();
    return (data && data.country) || 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
}

function isAllowedCountry(country: string): boolean {
  const raw = process.env.ALLOWED_COUNTRIES;
  const allow = raw
    ? raw.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    : ['JP'];
  return !!country && allow.includes(country.toUpperCase());
}

export async function GET(req: Request) {
  const ip = pickClientIp(req);
  const userAgent = (req.headers.get('user-agent') || '').slice(0, 1024);

  // どこで失敗しても最終レスポンスは200で返す方針
  let country = 'UNKNOWN';
  let isAdmin = false;
  let inBlacklist = false;

  try {
    country = await lookupCountry(ip);
  } catch {}

  try {
    isAdmin = await isAdminIp(ip);
  } catch {}

  try {
    inBlacklist = await isIpBlocked(ip);
  } catch {}

  const allowedCountry = isLocalOrPrivate(ip) ? true : isAllowedCountry(country);
  const blocked = !isAdmin && (inBlacklist || !allowedCountry);

  const payload = {
    status: 'ok' as const,
    ip,
    country,
    isAdmin,
    allowedCountry,
    blocked,
    userAgent,
    timestamp: Date.now(),
  };

  // Firestore書き込みは失敗してもレスポンスには影響させない
  try {
    if (db) await addDoc(collection(db, 'access_logs'), payload);
  } catch {}

  return NextResponse.json(payload, { status: 200 });
}
