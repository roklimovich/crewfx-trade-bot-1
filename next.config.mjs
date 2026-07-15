/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';

// 'unsafe-eval' is required by Next.js's dev-mode Fast Refresh / webpack HMR runtime — without
// it, EVERY client-side script silently fails to evaluate in `next dev` (forms, buttons, all of
// it just stop working, with no obvious error unless you check the browser console). It is NOT
// needed in production builds, so it's added only when NODE_ENV === 'development'.
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com https://*.tradingview.com;"
  : "script-src 'self' 'unsafe-inline' https://s3.tradingview.com https://*.tradingview.com;";

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: `default-src 'self'; ${scriptSrc} style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: https:; frame-src 'self' https://*.tradingview.com;`,
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
