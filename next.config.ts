import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingExcludes: { '*': ['**/data/**', '**/backups/**', '**/releases/**', '**/.env*', '**/docs/**', '**/tests/**'] },
  images: { unoptimized: true },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
    ] }];
  },
};

export default nextConfig;
