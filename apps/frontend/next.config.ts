import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    const isDev = process.env.NODE_ENV !== "production";
    const localBase = (process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");
    const prodBase = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://teampulse-production.up.railway.app/api/v1").replace(/\/$/, "");

    return [
      {
        source: "/api/v1/:path*",
        destination: isDev ? `${localBase}/api/v1/:path*` : `${prodBase}/:path*`,
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
