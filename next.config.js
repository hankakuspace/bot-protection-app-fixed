// next.config.js
/** @type {import('next').NextConfig} */

const path = require("path");
const PROXY_SUBPATH = process.env.SHOPIFY_PROXY_SUBPATH || "bot-protection-proxy";

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  output: "standalone",

  webpack: (config) => {
    // ✅ "@/..." を "src/..." に解決できるように追加
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors https://admin.shopify.com https://*.myshopify.com;",
          },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "accelerometer=(), ambient-light-sensor=(), autoplay=(), camera=(), encrypted-media=(), fullscreen=*, geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), speaker=(), usb=()",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // 🚫 無限ループの原因だった redirect は削除済み
      { source: "/auth", destination: "/api/auth", permanent: false },
      { source: "/auth/callback", destination: "/api/auth/callback", permanent: false },
    ];
  },

  async rewrites() {
    return [
      { source: `/apps/${PROXY_SUBPATH}`, destination: "/api/shopify/proxy" },
      {
        source: `/apps/${PROXY_SUBPATH}/:path*`,
        destination: "/api/shopify/proxy?extra_path=:path*",
      },
    ];
  },
};

module.exports = nextConfig;
