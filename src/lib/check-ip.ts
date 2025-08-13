// src/lib/check-ip.ts
import { db } from '@/lib/firebase';
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs,
  query, serverTimestamp, where
} from 'firebase/firestore';

type CheckArgs = {
  ip: string;
  userAgent?: string;
  shop?: string;
  customerId?: string;
};

type CheckResult = {
  blocked: boolean;
  allowedCountry: boolean;
  country: string | null;
  isAdmin: boolean;
  reason?: string;
};

const COLL_BLOCKED_IPS = 'blocked_ips';
const COLL_ADMIN_IPS = 'admin_ips';
const COLL_ALLOWED_COUNTRIES = 'allowed_countries';
const COLL_ACCESS_LOGS = 'access_logs';

// ---- ipinfo で国コード取得 ----
async function getCountryFromIpinfo(ip: string): Promise<string | null> {
  try {
    if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip === '::1') return 'LOCAL';
    const token = process.env.IPINFO_TOKEN;
    if (!token) return null;
    const res = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}?token=${token}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.country as string) || null;
  } catch {
    return null;
  }
}

async function isIpInCollection(coll: string, ip: string): Promise<boolean> {
  const q = query(collection(db, coll), where('ip', '==', ip));
  const snap = await getDocs(q);
  return !snap.empty;
}

async function isAdminIp(ip: string) { return isIpInCollection(COLL_ADMIN_IPS, ip); }
async function isBlockedIp(ip: string) { return isIpInCollection(COLL_BLOCKED_IPS, ip); }

async function isCountryAllowed(country: string | null) {
  // allowlist が空なら全許可
  const allowSnap = await getDocs(collection(db, COLL_ALLOWED_COUNTRIES));
  if (allowSnap.empty) return true;
  if (!country) return false;

  // ドキュメントID = 国コード方式
  const byId = await getDoc(doc(db, COLL_ALLOWED_COUNTRIES, country));
  if (byId.exists()) return !!(byId.data()?.enabled ?? true);

  // code フィールド方式（保険）
  const qSnap = await getDocs(
    query(collection(db, COLL_ALLOWED_COUNTRIES), where('code', '==', country))
  );
  if (!qSnap.empty) return !!(qSnap.docs[0].data()?.enabled ?? true);

  return false;
}

// ====== ★ route.ts から呼ばれる本体 ======
export async function checkIpAndLog(args: CheckArgs): Promise<CheckResult> {
  const ip = (args.ip || '').trim();
  const userAgent = args.userAgent || '';
  const shop = args.shop || '';
  const customerId = args.customerId || '';

  const country = await getCountryFromIpinfo(ip);
  const [admin, blockedByList, allowedByCountry] = await Promise.all([
    isAdminIp(ip),
    isBlockedIp(ip),
    isCountryAllowed(country),
  ]);

  let blocked = blockedByList || !allowedByCountry;
  let reason: string | undefined;
  if (blockedByList) reason = 'blocked_ip';
  else if (!allowedByCountry) reason = 'country_not_allowed';

  // 管理者は常に許可
  if (admin) { blocked = false; reason = undefined; }

  // ログ保存（失敗は無視）
  try {
    await addDoc(collection(db, COLL_ACCESS_LOGS), {
      ip,
      country: country || null,
      allowedCountry: allowedByCountry,
      blocked,
      isAdmin: admin,
      userAgent,
      shop,
      customerId,
      timestamp: serverTimestamp(),
    });
  } catch {}

  return { blocked, allowedCountry: allowedByCountry, country, isAdmin: admin, reason };
}

// ====== 管理UI向けのユーティリティ ======
export async function isIpBlocked(ip: string): Promise<boolean> {
  if (!ip) return false;
  const qSnap = await getDocs(query(collection(db, COLL_BLOCKED_IPS), where('ip', '==', ip)));
  return !qSnap.empty;
}

export async function blockIp(ip: string, reason: string = 'manual'): Promise<void> {
  if (!ip) return;
  if (await isIpBlocked(ip)) return;
  await addDoc(collection(db, COLL_BLOCKED_IPS), { ip, reason, createdAt: Date.now() });
}

export async function unblockIp(ip: string): Promise<void> {
  if (!ip) return;
  const qSnap = await getDocs(query(collection(db, COLL_BLOCKED_IPS), where('ip', '==', ip)));
  await Promise.all(qSnap.docs.map((d) => deleteDoc(d.ref)));
}
