// src/lib/ipMatch.ts
import * as ipaddr from "ipaddr.js";

/** 入力IP文字列を正規化（IPv6は完全表記に） */
export function normalizeIp(input: string): string {
  const ip = ipaddr.parse(input.trim());
  // IPv4は toString()、IPv6は toNormalizedString() を使い分け
  return ip.kind() === "ipv6"
    ? (ip as ipaddr.IPv6).toNormalizedString()
    : ip.toString();
}

/** "A/B" 形式のCIDRを正規化（IPv6は完全表記） */
export function normalizeCidr(input: string): string {
  const [addr, range] = ipaddr.parseCIDR(input.trim());
  const a =
    addr.kind() === "ipv6"
      ? (addr as ipaddr.IPv6).toNormalizedString()
      : addr.toString();
  return `${a}/${range}`;
}

/** ルール（単一IP or CIDR）の文字列かどうか */
function isCidr(rule: string): boolean {
  return rule.includes("/");
}

/** ip が rules のどれかに一致するか（単一/IPv4CIDR/IPv6CIDR対応） */
export function isIpBlocked(ipRaw: string, rules: string[]): boolean {
  let ip: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    ip = ipaddr.parse(ipRaw.trim());
  } catch {
    return false; // 解析不能は弾かない（安全側にしたいなら true にもできる）
  }

  for (const r of rules) {
    const rule = r.trim();
    if (!rule) continue;

    if (isCidr(rule)) {
      try {
        const [net, range] = ipaddr.parseCIDR(rule);
        if (ip.match([net, range])) return true;
      } catch {
        // 無効なCIDRはスキップ
      }
    } else {
      // 単一IP（正規化して比較）
      try {
        const normRule = normalizeIp(rule);
        const normIp =
          ip.kind() === "ipv6"
            ? (ip as ipaddr.IPv6).toNormalizedString()
            : ip.toString();
        if (normIp === normRule) return true;
      } catch {
        // 無効なIPはスキップ
      }
    }
  }
  return false;
}
