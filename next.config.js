// next.config.js
/** @type {import('next').NextConfig} */
const path = require("path");

module.exports = {
  reactStrictMode: true,

  // ✅ Vercel側でも確実にwebpack aliasを解決
  webpack: (config) => {
    const alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "src"),
    };

    config.resolve = {
      ...config.resolve,
      alias,
    };

    console.log("✅ Webpack alias applied:", alias);

    return config;
  },
};
