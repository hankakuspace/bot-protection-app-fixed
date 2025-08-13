/** @type {import('next').NextConfig} */

const PROXY_SUBPATH = process.env.SHOPIFY_PROXY_SUBPATH || 'bot-protection-proxy';

const nextConfig = {
  reactStrictMode: true,
  // swcMinify: true, // ← 削除
  trailingSlash: false,
  output: 'standalone',

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: 'frame-ancestors https://admin.shopify.com https://*.myshopify.com;' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy',
            value: 'accelerometer=(), ambient-light-sensor=(), autoplay=(), camera=(), encrypted-media=(), fullscreen=*, geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), speaker=(), usb=()' },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // 🚫 これが無限ループの原因：{ source: '/api/:path*', destination: '/api/:path*' }
      // 必要なら “redirect” ではなく “rewrite” を検討してください（ただし今回は不要）

      // （任意）/auth を API に寄せたい場合だけ残す。不要なら消してOK
      { source: '/auth', destination: '/api/auth', permanent: false },
      { source: '/auth/callback', destination: '/api/auth/callback', permanent: false },
    ];
  },

  async rewrites() {
    return [
      { source: `/apps/${PROXY_SUBPATH}`, destination: '/api/shopify/proxy' },
      { source: `/apps/${PROXY_SUBPATH}/:path*`, destination: '/api/shopify/proxy?extra_path=:path*' },
    ];
  },
};

module.exports = nextConfig;
