import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
      // Product images that were not copied during the Firebase migration.
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
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
