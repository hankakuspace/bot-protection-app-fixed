// シンプルな JSON 保存。将来 Vercel Blob/KV に差し替え可能な形に。
import fs from "fs/promises";
import path from "path";

type IpRules = { blocked: string[] };

const FILE = path.join("/tmp", "ip-blocks.json");

async function load(): Promise<IpRules> {
  try {
    const buf = await fs.readFile(FILE, "utf8");
    const data = JSON.parse(buf) as IpRules;
    if (!Array.isArray(data.blocked)) return { blocked: [] };
    // 正規化（重複排除/トリム）
    const uniq = Array.from(new Set(data.blocked.map(s => s.trim()).filter(Boolean)));
    return { blocked: uniq };
  } catch {
    return { blocked: [] };
  }
}

async function save(rules: IpRules): Promise<void> {
  const payload = JSON.stringify(rules, null, 2);
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, payload, "utf8");
}

export async function listIps(): Promise<string[]> {
  const { blocked } = await load();
  return blocked;
}

export async function addIp(ip: string): Promise<{ added: boolean; blocked: string[] }> {
  ip = ip.trim();
  if (!ip) return { added: false, blocked: await listIps() };
  const { blocked } = await load();
  if (blocked.includes(ip)) return { added: false, blocked };
  const next = { blocked: [...blocked, ip] };
  await save(next);
  return { added: true, blocked: next.blocked };
}

export async function removeIp(ip: string): Promise<{ removed: boolean; blocked: string[] }> {
  ip = ip.trim();
  const { blocked } = await load();
  const nextList = blocked.filter(x => x !== ip);
  const removed = nextList.length !== blocked.length;
  if (removed) await save({ blocked: nextList });
  return { removed, blocked: nextList };
}
