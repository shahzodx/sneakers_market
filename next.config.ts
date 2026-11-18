import type { NextConfig } from 'next';
const config: NextConfig = {
  devIndicators: false,
  output: 'standalone',
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      ...(process.env.S3_PUBLIC_URL
        ? [{ protocol: 'https' as const, hostname: new URL(process.env.S3_PUBLIC_URL).hostname }]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'" +
              (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '') +
              "; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com" +
              (process.env.S3_PUBLIC_URL ? ' ' + new URL(process.env.S3_PUBLIC_URL).origin : '') +
              "; font-src 'self'; connect-src 'self'" +
              (process.env.NODE_ENV === 'development' ? ' ws:' : '') +
              (process.env.S3_ENDPOINT ? ' ' + new URL(process.env.S3_ENDPOINT).origin : '') +
              "; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
          },
        ],
      },
    ];
  },
};
export default config;
