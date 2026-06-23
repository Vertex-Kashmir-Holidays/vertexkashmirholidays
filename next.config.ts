import type { NextConfig } from "next";

// Host of the branded placeholder image (env-driven so it follows the
// deployment). Added to image remotePatterns so next/image can serve it.
const PLACEHOLDER_HOST = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_PLACEHOLDER_IMAGE ??
        "https://vertexkashmirholidays.vercel.app/uploads/general/1782136262740-dy3wqa.svg",
    ).hostname;
  } catch {
    return "vertexkashmirholidays.vercel.app";
  }
})();

const nextConfig: NextConfig = {
  images: {
    // Serve modern formats; Next negotiates AVIF → WebP → original per browser.
    formats: ["image/avif", "image/webp"],
    // Cache optimized images aggressively (31 days) to cut repeat-view cost.
    minimumCacheTTL: 2678400,
    // Brand logo lockups are SVG (served from /public). Allow next/image to
    // render them; CSP sandbox prevents script execution inside the SVG.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: PLACEHOLDER_HOST,
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
