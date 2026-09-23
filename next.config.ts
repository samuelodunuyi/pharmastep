import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
      // Product images that were not copied during the Firebase migration (the old site's bucket only,
      // so the image optimiser can't be used for anyone else's files).
      { protocol: "https", hostname: "firebasestorage.googleapis.com", pathname: "/v0/b/shopper-56289.appspot.com/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // No framing by other sites (clickjacking), no plugins, no <base> hijacking.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      // Prescription photos from phones can be a few MB.
      bodySizeLimit: "8mb",
    },
  },
  async redirects() {
    // Keep links from the old Vue site working.
    return [
      { source: "/auth/login", destination: "/login", permanent: true },
      { source: "/auth/register", destination: "/register", permanent: true },
      { source: "/profile/account", destination: "/account", permanent: true },
      { source: "/productType/:form", destination: "/products?form=:form", permanent: true },
    ];
  },
};

export default nextConfig;
