import * as ipaddr from "ipaddr.js";

export function normalizeIp(input: string): string {
  const ip = ipaddr.parse(input.trim());
  return ip.kind() === "ipv6"
    ? (ip as ipaddr.IPv6).toNormalizedString()
    : ip.toString();
}
export function normalizeCidr(input: string): string {
  const [addr, range] = ipaddr.parseCIDR(input.trim());
  const a = addr.kind() === "ipv6"
    ? (addr as ipaddr.IPv6).toNormalizedString()
    : addr.toString();
  return `${a}/${range}`;
}

// 旧API互換
export function isIpBlocked(ipRaw: string, rules: string[]): boolean {
  return matchIpRule(ipRaw, rules) !== null;
}

// 追加: マッチしたルール文字列を返す（なければ null）
export function matchIpRule(ipRaw: string, rules: string[]): string | null {
  let ip: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    ip = ipaddr.parse(ipRaw.trim());
  } catch {
    return null;
  }
  for (const rule of rules) {
    const r = rule.trim();
    if (!r) continue;
    if (r.includes("/")) {
      try {
        const [net, range] = ipaddr.parseCIDR(r);
        if (ip.match([net, range])) return r;
      } catch {}
    } else {
      try {
        const normRule = normalizeIp(r);
        const normIp = ip.kind() === "ipv6"
          ? (ip as ipaddr.IPv6).toNormalizedString()
          : ip.toString();
        if (normIp === normRule) return r;
      } catch {}
    }
  }
  return null;
}
