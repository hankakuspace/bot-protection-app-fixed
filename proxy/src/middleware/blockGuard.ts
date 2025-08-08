import type { Request, Response, NextFunction } from 'express';
import { db } from '../firebase';

/**
 * very small in-memory cache to reduce Firestore reads
 */
type CacheEntry = { v: boolean; exp: number };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 60_000; // 60s

const getCached = (key: string) => {
  const it = cache.get(key);
  return it && it.exp > Date.now() ? it.v : undefined;
};
const setCached = (key: string, value: boolean) => {
  cache.set(key, { v: value, exp: Date.now() + TTL_MS });
};

/** allow external clearing (from /admin/clear-block-cache) */
export const clearBlockCache = () => cache.clear();

/**
 * Extract the best-guess client IP and country (ISO2).
 * - IP: X-Forwarded-For > socket remote > req.ip
 * - Country: CF-IPCountry > X-Geo-Country
 */
function extractClient(req: Request) {
  const ipHeader = (req.headers['x-forwarded-for'] as string) || '';
  const ipFromHeader = ipHeader.split(',')[0]?.trim();
  const ipSocket = req.socket?.remoteAddress?.replace('::ffff:', '');
  const ip = ipFromHeader || ipSocket || req.ip || 'UNKNOWN';

  const ct =
    (req.headers['cf-ipcountry'] as string) ||
    (req.headers['x-geo-country'] as string) ||
    'UNKNOWN';
  const country = (ct || 'UNKNOWN').toUpperCase();

  return { ip, country };
}

/**
 * Main middleware
 */
export async function blockGuard(req: Request, res: Response, next: NextFunction) {
  // healthcheck & static files should pass
  if (req.path === '/health') return next();
  if (req.method === 'GET' && req.path.startsWith('/blocked.html')) return next();

  // (index.ts 側でも trust proxy を有効にしているが保険で)
  req.app.set('trust proxy', true);

  const { ip, country } = extractClient(req);

  try {
    const ipKey = `ip:${ip}`;
    const ctKey = `ct:${country}`;

    let ipBlocked = getCached(ipKey);
    let ctBlocked = getCached(ctKey);

    if (ipBlocked === undefined) {
      const snap = await db.collection('block_ips').doc(ip).get();
      ipBlocked = snap.exists && !!snap.data()?.enabled;
      setCached(ipKey, ipBlocked);
    }

    if (ctBlocked === undefined) {
      const snap = await db.collection('block_countries').doc(country).get();
      ctBlocked = snap.exists && !!snap.data()?.enabled;
      setCached(ctKey, ctBlocked);
    }

    if (ipBlocked || ctBlocked) {
      return res.redirect(302, '/blocked.html');
    }

    return next();
  } catch (err) {
    // 障害時は通す（本番ポリシーに合わせて 503/403 にしてもOK）
    console.error('blockGuard error:', err);
    return next();
  }
}
