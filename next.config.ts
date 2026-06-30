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


// Security headers applied to every response via headers(). CSP is intentionally
// absent here — it is set per-request with a fresh nonce in src/proxy.ts
// (middleware) so that 'strict-dynamic' nonce-based enforcement works correctly.
// A static CSP baked at build time cannot contain per-request nonces.
const securityHeaders = [
 {
   key: "Strict-Transport-Security",
   value: "max-age=63072000; includeSubDomains; preload",
 },
 { key: "X-Content-Type-Options", value: "nosniff" },
 { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
 { key: "X-Frame-Options", value: "SAMEORIGIN" },
 {
   // camera / microphone / display-capture must be allowed for the Jitsi iframe
   // (meet.jit.si) that external_api.js mounts.  All other sensitive features
   // remain blocked.  The old camera=() / microphone=() blanket-blocked every
   // iframe including Jitsi, making audio/video calls impossible.
   key: "Permissions-Policy",
   value: [
     'camera=(self "https://meet.jit.si")',
     'microphone=(self "https://meet.jit.si")',
     'display-capture=(self "https://meet.jit.si")',
     "geolocation=()",
     "browsing-topics=()",
   ].join(", "),
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
   qualities: [60, 75, 85]
 },
};


export default nextConfig;
