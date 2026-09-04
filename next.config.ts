import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Flyers, recap stills and sponsor logos come from the marketing site's feed.
    // Editor uploads there land on Vercel Blob, so both hosts have to be allowed
    // or next/image refuses to optimize them and the artwork silently vanishes.
    remotePatterns: [
      { protocol: "https", hostname: "www.millersmarketinggroup.com" },
      { protocol: "https", hostname: "millersmarketinggroup.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [
      {
        // The service worker must not be cached, or returning visitors get stuck
        // on a stale shell after a redeploy.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
