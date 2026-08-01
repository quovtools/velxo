import type { NextConfig } from "next";

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
        destination: 'http://localhost:3001/api/v1',
      },
      // Proxy all other /api/v1/* requests to the backend
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:3001/api/v1/:path*',
      },
    ]
  },
};

export default nextConfig;
