import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    const isDev = process.env.NODE_ENV !== "production";
    if (!isDev) return [];

    const localBase = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000")
      .replace(/\/$/, "");

    return [
      {
        source: "/api/v1/:path*",
        destination: `${localBase}/api/v1/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
    ],
  },
};

export default nextConfig;
