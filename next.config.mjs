/**
 * Standalone output produces `.next/standalone` with a self-contained `server.js`.
 * It is only wanted on VPS/Docker hosts, where we ship our own image.
 * Hostinger Node.js web apps run the app from the project root via `server.js`
 * (see /server.js) or `next start`, so standalone must stay OFF there.
 * Enable with: NEXT_OUTPUT=standalone
 */
const standalone = process.env.NEXT_OUTPUT === 'standalone';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(standalone ? { output: 'standalone' } : {}),
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
export default nextConfig;
