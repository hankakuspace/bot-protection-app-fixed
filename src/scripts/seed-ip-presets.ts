#!/usr/bin/env ts-node

/**
 * 使い方:
 *   ts-node scripts/seed-ip-presets.ts JP CN --endpoint https://bot-protection-ten.vercel.app
 *
 * ファイル構成:
 *   presets/JP.txt  ... CIDRまたはIPを1行ずつ
 *   presets/CN.txt  ... 同上
 */
import fs from "fs";
import path from "path";
import { setTimeout as sleep } from "timers/promises";

type Opts = { endpoint: string; dryRun: boolean; };
const args = process.argv.slice(2);
const codes: string[] = [];
const opts: Opts = { endpoint: "", dryRun: false };

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--endpoint") opts.endpoint = args[++i] || "";
  else if (a === "--dry-run") opts.dryRun = true;
  else codes.push(a.toUpperCase());
}
if (!opts.endpoint) {
  console.error("ERROR: --endpoint を指定してください（例: https://bot-protection-ten.vercel.app）");
  process.exit(1);
}
if (codes.length === 0) {
  console.error("ERROR: 国コードを指定してください（例: JP CN US）");
  process.exit(1);
}

async function postRule(rule: string) {
  if (opts.dryRun) {
    console.log("[DRY] add", rule);
    return;
  }
  const res = await fetch(`${opts.endpoint}/api/admin/ip-blocks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ip: rule }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`POST failed ${res.status}: ${t}`);
  }
}

async function main() {
  for (const cc of codes) {
    const file = path.resolve(`presets/${cc}.txt`);
    if (!fs.existsSync(file)) { console.warn(`WARN: ${cc} のプリセットが見つかりません: ${file}`); continue; }
    const raw = fs.readFileSync(file, "utf8");
    const rules = Array.from(new Set(
      raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    ));
    console.log(`== ${cc}: ${rules.length} ルールを登録します ==`);
    let n = 0;
    for (const r of rules) {
      try {
        await postRule(r);
        n++;
        if (n % 20 === 0) await sleep(200); // ちょい待ち（連投対策）
      } catch (e) {
        console.error("ERR:", r, (e as Error).message);
      }
    }
    console.log(`== ${cc}: 完了 (${n}/${rules.length}) ==`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
