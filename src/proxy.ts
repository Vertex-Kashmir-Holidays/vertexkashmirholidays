import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

// Edge-safe nonce: 16 random bytes encoded as base64 (128 bits of entropy).
// Buffer is not available in the Edge runtime — use Web Crypto + btoa instead.
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
}

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";
  // 'unsafe-eval' is required by React Fast Refresh / Turbopack in dev only.
  const scriptExtra = isDev ? " 'unsafe-eval'" : "";
  const connectExtra = isDev ? " ws: http://localhost:*" : "";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self' https://www.facebook.com https://*.facebook.com",
    "img-src 'self' data: blob: https://res.cloudinary.com https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com https://*.facebook.com https://www.google.co.in https://*.google.com https://googleads.g.doubleclick.net https://*.doubleclick.net",
    "font-src 'self' data: https://fonts.gstatic.com",
    // Inline styles are required by Tailwind and third-party UI libraries.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Nonce-based CSP (CSP3):
    //   'nonce-...'       — trusts only scripts that carry this per-request nonce.
    //   'strict-dynamic'  — propagates that trust to scripts dynamically created by
    //                       nonced scripts (covers GTM tags, Razorpay checkout.js,
    //                       Jitsi external_api.js, Turnstile, Next.js chunk loader).
    // CSP2 / legacy browser fallback (ignored by CSP3 browsers when strict-dynamic present):
    //   'unsafe-inline'   — allows inline scripts in browsers that don't honour nonces.
    //   host allowlists   — allows the named CDNs in browsers that don't support strict-dynamic.
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' 'wasm-unsafe-eval'${scriptExtra} https://*.razorpay.com https://challenges.cloudflare.com https://*.spline.design https://www.googletagmanager.com https://www.google-analytics.com https://meet.jit.si https://*.jit.si https://8x8.vc https://*.8x8.vc https://*.jaas.8x8.vc`,
    // meet.jit.si / *.jit.si — legacy Jitsi
    // 8x8.vc / *.8x8.vc     — JaaS (8x8 Jitsi as a Service) conference iframe
    // googletagmanager.com   — noscript <iframe> fallback + GTM Preview debugger
    // tagassistant.google.com — GTM Preview / Tag Assistant debugger iframe
    "frame-src 'self' https://*.razorpay.com https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://my.spline.design https://www.googletagmanager.com https://tagassistant.google.com https://meet.jit.si https://*.jit.si https://8x8.vc https://*.8x8.vc https://www.facebook.com https://*.facebook.com",
    // wss://meet.jit.si — Jitsi XMPP-over-WebSocket signalling
    // wss://*.8x8.vc    — JaaS WebSocket signalling
    // tagassistant.google.com — GTM Preview XHR channel
    // analytics.google.com   — GA4 collect endpoint (some regions / gtag versions)
    // *.8x8.vc covers one subdomain level. JaaS also uses deeper subdomains
    // (e.g. customer.api.jaas.8x8.vc) for AppID validation and branding.
    // Without these entries the external_api.js fetch is CSP-blocked, which
    // manifests as "browser not supported" inside the JaaS meeting iframe.
    `connect-src 'self' https://challenges.cloudflare.com https://*.razorpay.com https://api.open-meteo.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.googletagmanager.com https://tagassistant.google.com https://www.google.com https://*.google.com https://ad.doubleclick.net https://*.doubleclick.net https://www.facebook.com https://*.facebook.com https://connect.facebook.net https://meet.jit.si https://*.jit.si wss://meet.jit.si wss://*.jit.si https://8x8.vc https://*.8x8.vc wss://8x8.vc wss://*.8x8.vc https://*.jaas.8x8.vc https://*.api.jaas.8x8.vc wss://*.jaas.8x8.vc${connectExtra}`,
    // blob: — Jitsi/JaaS creates blob: URLs for local audio/video preview tracks
    "media-src 'self' blob: data: https://meet.jit.si https://*.jit.si https://8x8.vc https://*.8x8.vc",
    // JaaS loads web workers from its own domain — without this the WebRTC SDK
    // fails its browser-capabilities check and shows "browser not supported".
    "worker-src 'self' blob: https://8x8.vc https://*.8x8.vc https://*.jaas.8x8.vc",
  ].join("; ");
}

// Auth.js v5 handler pattern: runs the NextAuth auth check for all matched
// routes, then calls our middleware function. For protected routes (/admin,
// /account) the authorized callback in auth.config.ts gates access before
// this handler is reached; for public routes it returns true immediately.
export default auth(function middleware(req: NextRequest) {
  const nonce = generateNonce();
  const csp = buildCsp(nonce);

  // Forward the nonce on the request so server components can read it via
  // headers().get("x-nonce") without re-computing or exposing it in markup.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
});

// Match all routes except Next.js internal static assets and image optimisation
// endpoints. The 'missing' clause skips RSC prefetch requests (they're not HTML
// documents and don't need a nonce injected).
export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
