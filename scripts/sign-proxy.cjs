// scripts/sign-proxy.cjs
#!/usr/bin/env node
/**
 * 使い方：
 *   SHOPIFY_API_SECRET='xxx' node scripts/sign-proxy.cjs "https://be-search.biz/apps/bpp-20250814/ping"
 *   SHOPIFY_API_SECRET='xxx' node scripts/sign-proxy.cjs "https://bot-protection-ten.vercel.app/api/shopify/proxy/ip-check?foo=bar"
 *
 * 出力は「1行の curl」→ そのままパイプで sh 実行可：
 *   SHOPIFY_API_SECRET='xxx' node scripts/sign-proxy.cjs "..." | sh
 */
const crypto = require('crypto');
const assert = require('assert');

const SECRET = process.env.SHOPIFY_API_SECRET || '';
if (!SECRET) {
  console.error('ERROR: Set SHOPIFY_API_SECRET');
  process.exit(1);
}

const raw = process.argv[2];
if (!raw) {
  console.error('USAGE: node scripts/sign-proxy.cjs "<URL>"');
  process.exit(1);
}

const url = new URL(raw);

// App Proxy 経由のときは、Shopify が最低限付ける代表値を補助（テスト用）
const isAppProxy = /\/apps\/[^/]+/.test(url.pathname);
if (isAppProxy) {
  // 無ければ追加（実運用では Shopify が付与）
  if (!url.searchParams.get('shop')) url.searchParams.set('shop', 'ruhra-store.myshopify.com');
  if (!url.searchParams.get('path_prefix')) {
    const m = url.pathname.match(/^(\/apps\/[^/]+)/);
    if (m) url.searchParams.set('path_prefix', m[1]);
  }
  if (!url.searchParams.get('logged_in_customer_id')) url.searchParams.set('logged_in_customer_id', '');
  if (!url.searchParams.get('timestamp')) url.searchParams.set('timestamp', String(Math.floor(Date.now() / 1000)));
}

// canonical（signature除外・キー昇順）
const entries = [];
url.searchParams.forEach((v, k) => {
  if (k === 'signature') return;
  entries.push([k, v]);
});
entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
const canonical = entries.map(([k, v]) => `${k}=${v}`).join('&');
const sig = crypto.createHmac('sha256', SECRET).update(canonical, 'utf8').digest('hex');

// 署名付加
url.searchParams.set('signature', sig);

// 1行 curl を出力
const curl = `curl -i -H 'Accept: application/json' "${url.toString()}"`;
process.stdout.write(curl + '\n');
