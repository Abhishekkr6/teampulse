/** @type {import("next").NextConfig} */
const nextConfig = {
  reactCompiler: true,

  async rewrites() {
    const isDev = process.env.NODE_ENV !== "production";

    const localBase = (
      process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || "http://localhost:4000"
    ).replace(/\/$/, "");

    // NOTE: prodBase MUST NOT contain a trailing /api/v1
    const prodBase = (
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "https://teampulse-production.up.railway.app"
    ).replace(/\/$/, "");

    return [
      // proxy all api calls to backend
      {
        source: "/api/v1/:path*",
        destination: isDev
          ? `${localBase}/api/v1/:path*`
          : `${prodBase}/api/v1/:path*`,
      },

      // GitHub login entrypoint (frontend -> proxy -> backend)
      {
        source: "/auth/github",
        destination: isDev
          ? `${localBase}/api/v1/auth/github`
          : `${prodBase}/api/v1/auth/github`,
      },

      // GitHub callback (frontend -> proxy -> backend)
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
