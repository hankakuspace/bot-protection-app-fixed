/** @type {import('next').NextConfig} */

// App Proxy のサブパス（Shopify 側の「サブパス」と一致）
const PROXY_SUBPATH = process.env.SHOPIFY_PROXY_SUBPATH || 'bot-protection-proxy';

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: false,
  output: 'standalone',

  // ※ 機密情報はここ（env）に書かないでください！
  //   next.config.js の env はクライアントへもバンドルされます。
  //   すべて Vercel の Environment Variables / .env.* で管理してください。

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // Shopify 管理画面・店舗ドメインからの埋め込みを許可
            value: 'frame-ancestors https://admin.shopify.com https://*.myshopify.com;',
          },
          // X-Frame-Options は DENY/SAMEORIGIN しかなく、CSP と競合しやすいので付けない
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value:
              'accelerometer=(), ambient-light-sensor=(), autoplay=(), camera=(), encrypted-media=(), fullscreen=*, geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), speaker=(), usb=()',
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: '/auth', destination: '/api/auth', permanent: false },
      { source: '/auth/callback', destination: '/api/auth/callback', permanent: false },
    ];
  },

  async rewrites() {
    return [
      // 例: /apps/bot-protection-proxy → /api/shopify/proxy
      { source: `/apps/${PROXY_SUBPATH}`, destination: '/api/shopify/proxy' },
      // 例: /apps/bot-protection-proxy/check → /api/shopify/proxy?extra_path=check
      { source: `/apps/${PROXY_SUBPATH}/:path*`, destination: '/api/shopify/proxy?extra_path=:path*' },
    ];
  },
};

module.exports = nextConfig;
