// 簡易ストア（/tmpにJSON保存）。Serverless再起動で消える前提です。
import { promises as fs } from "fs";
const FILE = "/tmp/blocked-ips.json";

export async function listIps(): Promise<string[]> {
  try {
    const buf = await fs.readFile(FILE, "utf8");
    const arr = JSON.parse(buf);
    return Array.isArray(arr) ? arr as string[] : [];
  } catch {
    return [];
  }
}

export async function setIps(rules: string[]): Promise<void> {
  await fs.writeFile(FILE, JSON.stringify(rules), "utf8");
}
