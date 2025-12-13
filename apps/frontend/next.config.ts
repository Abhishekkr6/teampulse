/** @type {import("next").NextConfig} */
const nextConfig = {
  reactCompiler: true,

  async rewrites() {
    const isDev = process.env.NODE_ENV !== "production";

    const localBase = (
      process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL ||
      "http://localhost:4000"
    ).replace(/\/$/, "");

    // IMPORTANT: no /api/v1 here
    const prodBase = (
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "https://teampulse-production.up.railway.app"
    ).replace(/\/$/, "");

    return [
      // ✅ All API calls
      {
        source: "/api/v1/:path*",
        destination: isDev
          ? `${localBase}/api/v1/:path*`
          : `${prodBase}/api/v1/:path*`,
      },

      // ✅ GitHub LOGIN (FIXED)
      {
        source: "/auth/github/login",
        destination: isDev
          ? `${localBase}/api/v1/auth/github/login`
          : `${prodBase}/api/v1/auth/github/login`,
      },

      // ✅ GitHub CALLBACK (already correct)
      {
        source: "/auth/github/callback",
        destination: isDev
          ? `${localBase}/api/v1/auth/github/callback`
          : `${prodBase}/api/v1/auth/github/callback`,
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "github.com" },
    ],
  },
};

export default nextConfig;
