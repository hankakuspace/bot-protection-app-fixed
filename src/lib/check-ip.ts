// src/lib/check-ip.ts
import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
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

async function getCountryFromIpinfo(ip: string): Promise<string | null> {
  try {
    if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip === '::1') {
      return 'LOCAL';
    }
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

async function isAdminIp(ip: string) {
  return isIpInCollection(COLL_ADMIN_IPS, ip);
}

async function isBlockedIp(ip: string) {
  return isIpInCollection(COLL_BLOCKED_IPS, ip);
}

async function isCountryAllowed(country: string | null) {
  const allowSnap = await getDocs(collection(db, COLL_ALLOWED_COUNTRIES));
  if (allowSnap.empty) return true;
  if (!country) return false;

  const byIdDoc = await getDoc(doc(db, COLL_ALLOWED_COUNTRIES, country));
  if (byIdDoc.exists()) {
    return !!(byIdDoc.data()?.enabled ?? true);
  }

  const qSnap = await getDocs(
    query(collection(db, COLL_ALLOWED_COUNTRIES), where('code', '==', country))
  );
  if (!qSnap.empty) {
    return !!(qSnap.docs[0].data()?.enabled ?? true);
  }

  return false;
}

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

  if (admin) {
    blocked = false;
    reason = undefined;
  }

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
  } catch {
    // ログ保存エラーは無視
  }

  return {
    blocked,
    allowedCountry: allowedByCountry,
    country,
    isAdmin: admin,
    reason,
  };
}
