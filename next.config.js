/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  // ✅ appDir は15.5以降常時有効なので不要
  webpack: (config) => {
    config.resolve.alias['@'] = path.join(__dirname, 'src'); // ← alias定義
    return config;
  },
};

module.exports = nextConfig;
