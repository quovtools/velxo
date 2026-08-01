import type { NextConfig } from "next";

// In the combined Fly.io container, the backend runs on the same host.
// BACKEND_PORT defaults to 3001 (matches Dockerfile ENV BACKEND_PORT=3001).
const backendPort = process.env.BACKEND_PORT || "3001";
const backendUrl = `http://localhost:${backendPort}`;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      // Proxy bare /api/v1 health-check (no trailing path segment)
      {
        source: '/api/v1',
        destination: `${backendUrl}/api/v1`,
      },
      // Proxy all /api/v1/* requests to the backend
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ]
  },
};

export default nextConfig;
