import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve modern formats; Next negotiates AVIF → WebP → original per browser.
    formats: ["image/avif", "image/webp"],
    // Cache optimized images aggressively (31 days) to cut repeat-view cost.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
