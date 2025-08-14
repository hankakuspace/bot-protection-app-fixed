// scripts/sign-proxy.cjs
#!/usr/bin/env node
/**
 * 使い方:
 *   SHOPIFY_API_SECRET='xxxx' node scripts/sign-proxy.cjs "https://be-search.biz/apps/<subpath>/ping"
 *   └ 1行の curl を stdout 出力（そのまま | sh 実行OK）
 */
const crypto = require("crypto");
const { URL } = require("url");

const secret = process.env.SHOPIFY_API_SECRET;
if (!secret) {
  console.error("ERROR: SHOPIFY_API_SECRET is not set");
  process.exit(1);
}

const target = process.argv[2];
if (!target) {
  console.error("Usage: sign-proxy.cjs <store-apps-url>");
  process.exit(1);
}

const u = new URL(target);
// 既に query が付いていてもOK。足りなければ補完する。
const params = u.searchParams;

// 既定値（必要に応じて編集）
if (!params.has("shop")) params.set("shop", "ruhra-store.myshopify.com");
if (!params.has("logged_in_customer_id")) params.set("logged_in_customer_id", "");
if (!params.has("timestamp")) params.set("timestamp", String(Math.floor(Date.now() / 1000)));

// path_prefix は /apps/<subpath>
const m = u.pathname.match(/^\/apps\/([^/]+)/);
if (!m) {
  console.error("ERROR: URL path must start with /apps/<subpath>/...");
  process.exit(1);
}
params.set("path_prefix", `/apps/${m[1]}`);

// 署名生成（signature は署名対象から除外）
const obj = {};
params.forEach((v, k) => {
  if (k !== "signature") obj[k] = v;
});
const canonical = Object.keys(obj)
  .sort()
  .map((k) => `${k}=${obj[k]}`)
  .join("&");
const signature = crypto.createHmac("sha256", secret).update(canonical).digest("hex");

// URL に signature を付与
params.set("signature", signature);

// 1行の curl を出力
const curl = [
  "curl -i -H 'Accept: application/json'",
  `'${u.toString()}'`,
].join(" \\\n  ");

console.log(curl);
