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

// Content-Security-Policy. Production is locked down to the origins the app
// actually uses (Razorpay checkout, Cloudflare Turnstile, YouTube embeds,
// Spline, Open-Meteo). Dev additionally allows the eval + websockets that React
// Fast Refresh / Turbopack need, so `next dev` keeps working.
function contentSecurityPolicy(): string {
  const isDev = process.env.NODE_ENV !== "production";
  const scriptExtra = isDev ? " 'unsafe-eval'" : "";
  const connectExtra = isDev ? " ws: http://localhost:*" : "";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${scriptExtra} https://checkout.razorpay.com https://challenges.cloudflare.com https://*.spline.design`,
    "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://my.spline.design",
    `connect-src 'self' https://challenges.cloudflare.com https://*.razorpay.com https://api.open-meteo.com${connectExtra}`,
    "worker-src 'self' blob:",
  ].join("; ");
}

// Applied to every response by middleware-adjacent `headers()`. These are the
// code-level hardening headers; anything host-level (e.g. forced HTTPS) is the
// platform's job.
const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
