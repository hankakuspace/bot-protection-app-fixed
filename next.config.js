// next.config.js
/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // ✅ 型エラーがあってもビルドを止めない
    ignoreBuildErrors: true,
  },
  outputFileTracingIncludes: {
    "/api/proxy": ["node_modules/geoip-lite/data/**/*"],
  },
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
};

module.exports = nextConfig;
