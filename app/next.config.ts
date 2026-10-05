import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // ── Server mode (Node.js) — required for Deals Platform API routes + ISR ──
  // Hostinger Web App Hosting: build = `npm run build`, start = `npm run start`
  // No static export — we need server-side rendering and API routes at runtime.
  trailingSlash: false,

  // Fix workspace root detection when there are multiple lockfiles
  outputFileTracingRoot: path.join(__dirname),

  // Image optimisation — allow Supabase storage + known CDN domains for brand logos
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
      { protocol: 'https', hostname: 'metrocardz.in' },
      { protocol: 'https', hostname: 'images.unsplash.com' }, // placeholder images in dev
    ],
  },

  // Prisma client must run on the server — exclude from Edge runtime
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],

  // Security headers for all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
