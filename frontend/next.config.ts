import type { NextConfig } from "next";

// In the combined Fly.io container, the backend runs on the same host.
// BACKEND_PORT defaults to 3001 (matches Dockerfile ENV BACKEND_PORT=3001).
const backendPort = process.env.BACKEND_PORT || "3001";
const backendUrl = `http://localhost:${backendPort}`;

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // — Image optimisation ————————————————————————————————————
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // — Compiler / bundle optimisation ————————————————————————
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  // — HTTP caching headers for immutable static assets ————————
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
      {
        source: "/:path*.jpg",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
      {
        source: "/:path*.svg",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
      {
        source: "/favicon.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
    ];
  },

  // — API proxy rewrites ————————————————————————————————————
  async rewrites() {
    return [
      // Proxy bare /api/v1 health-check (no trailing path segment)
      {
        source: "/api/v1",
        destination: `${backendUrl}/api/v1`,
      },
      // Proxy all /api/v1/* requests to the backend
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
