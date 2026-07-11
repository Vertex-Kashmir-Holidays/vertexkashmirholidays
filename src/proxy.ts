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

// Directives shared byte-for-byte between the nonce-based CSP (/admin,
// /account, /login) and the static CSP (public pages) — only script-src
// differs between the two, so this is the single source of truth for
// everything else to avoid the two policies drifting apart.
function sharedCspDirectives(): string[] {
  const isDev = process.env.NODE_ENV !== "production";
  const connectExtra = isDev ? " ws: http://localhost:*" : "";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self' https://www.facebook.com https://*.facebook.com",
    // static.tacdn.com / *.tripadvisor.com / *.tripadvisor.in — TripAdvisor's
    // live widget badge (/reviews page) loads its own logo/branding images
    // from these hosts.
    "img-src 'self' data: blob: https://res.cloudinary.com https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com https://*.facebook.com https://www.google.co.in https://*.google.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://static.tacdn.com https://*.tripadvisor.com https://*.tripadvisor.in",
    // static.tacdn.com — TripAdvisor's live widget CSS (/reviews page) declares
    // its own @font-face rules pointing at custom webfonts on this host.
    "font-src 'self' data: https://fonts.gstatic.com https://static.tacdn.com",
    // Inline styles are required by Tailwind and third-party UI libraries.
    // accounts.google.com — Google One Tap injects its own <link rel="stylesheet">
    // for the prompt UI (separate from the iframe it also renders).
    // static.tacdn.com — TripAdvisor's live widget (/reviews page) injects its
    // own <link rel="stylesheet"> for the badge's visual styling (confirmed by
    // fetching the widget's actual script source — it calls
    // document.createStyleSheet/creates a <link> pointing at
    // static.tacdn.com/css2/... — without this host the script runs but the
    // badge renders completely unstyled).
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com https://static.tacdn.com",
    // meet.jit.si / *.jit.si — legacy Jitsi
    // 8x8.vc / *.8x8.vc     — JaaS (8x8 Jitsi as a Service) conference iframe
    // googletagmanager.com   — noscript <iframe> fallback + GTM Preview debugger
    // tagassistant.google.com — GTM Preview / Tag Assistant debugger iframe
    // accounts.google.com    — Google One Tap's prompt UI renders in its own iframe
    "frame-src 'self' https://*.razorpay.com https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://my.spline.design https://www.googletagmanager.com https://tagassistant.google.com https://meet.jit.si https://*.jit.si https://8x8.vc https://*.8x8.vc https://www.facebook.com https://*.facebook.com https://accounts.google.com",
    // wss://meet.jit.si — Jitsi XMPP-over-WebSocket signalling
    // wss://*.8x8.vc    — JaaS WebSocket signalling
    // tagassistant.google.com — GTM Preview XHR channel
    // analytics.google.com   — GA4 collect endpoint (some regions / gtag versions)
    // *.8x8.vc covers one subdomain level. JaaS also uses deeper subdomains
    // (e.g. customer.api.jaas.8x8.vc) for AppID validation and branding.
    // Without these entries the external_api.js fetch is CSP-blocked, which
    // manifests as "browser not supported" inside the JaaS meeting iframe.
    // api.cloudinary.com — direct browser→Cloudinary signed uploads (videos bypass
    // our own server to avoid Vercel's ~4.5 MB Serverless Function body limit).
    // accounts.google.com — Google One Tap's client library calls this for
    // credential issuance and session status checks.
    `connect-src 'self' https://api.cloudinary.com https://challenges.cloudflare.com https://*.razorpay.com https://api.open-meteo.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.googletagmanager.com https://tagassistant.google.com https://www.google.com https://*.google.com https://accounts.google.com https://ad.doubleclick.net https://*.doubleclick.net https://www.facebook.com https://*.facebook.com https://connect.facebook.net https://meet.jit.si https://*.jit.si wss://meet.jit.si wss://*.jit.si https://8x8.vc https://*.8x8.vc wss://8x8.vc wss://*.8x8.vc https://*.jaas.8x8.vc https://*.api.jaas.8x8.vc wss://*.jaas.8x8.vc${connectExtra}`,
    // blob: — Jitsi/JaaS creates blob: URLs for local audio/video preview tracks
    // res.cloudinary.com — video review clips uploaded via the Gallery/Cloudinary flow
    "media-src 'self' blob: data: https://res.cloudinary.com https://meet.jit.si https://*.jit.si https://8x8.vc https://*.8x8.vc",
    // JaaS loads web workers from its own domain — without this the WebRTC SDK
    // fails its browser-capabilities check and shows "browser not supported".
    "worker-src 'self' blob: https://8x8.vc https://*.8x8.vc https://*.jaas.8x8.vc",
  ];
}

// The explicit script host allowlist. Under the nonce+strict-dynamic CSP this
// list is only a CSP2/legacy-browser fallback (strict-dynamic propagates
// trust to anything a nonced script creates, regardless of host). Under the
// static CSP (no nonce, no strict-dynamic) this list is the *only* thing that
// allows these scripts to run, so it must be complete.
// TripAdvisor's live reviews widget (/reviews page) loads a chain of scripts
// across several hosts, fully traced by fetching each script's actual source
// server-side rather than guessing from CSP errors one at a time:
//   www.jscache.com/wejs?...
//     -> www.tripadvisor.in/WidgetEmbed-excellent?... (creates a <link> for
//        static.tacdn.com CSS — see style-src — and a <script> for:)
//       -> static.tacdn.com/js3/build/concat/widget/cdswidgets_min-*.js
//          (end of the chain — only creates an <a>, no further hosts)
// www.tripadvisor.com is also allowed since one variant of the first hop
// creates a script pointing there instead of tripadvisor.in directly.
const SCRIPT_HOSTS =
  "https://*.razorpay.com https://challenges.cloudflare.com https://*.spline.design https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://meet.jit.si https://*.jit.si https://8x8.vc https://*.8x8.vc https://*.jaas.8x8.vc https://accounts.google.com https://www.jscache.com https://www.tripadvisor.com https://www.tripadvisor.in https://static.tacdn.com";

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";
  // 'unsafe-eval' is required by React Fast Refresh / Turbopack in dev only.
  const scriptExtra = isDev ? " 'unsafe-eval'" : "";

  const directives = sharedCspDirectives();
  // Nonce-based CSP (CSP3):
  //   'nonce-...'       — trusts only scripts that carry this per-request nonce.
  //   'strict-dynamic'  — propagates that trust to scripts dynamically created by
  //                       nonced scripts (covers GTM tags, Razorpay checkout.js,
  //                       Jitsi external_api.js, Turnstile, Next.js chunk loader).
  // CSP2 / legacy browser fallback (ignored by CSP3 browsers when strict-dynamic present):
  //   'unsafe-inline'   — allows inline scripts in browsers that don't honour nonces.
  //   host allowlists   — allows the named CDNs in browsers that don't support strict-dynamic.
  directives.push(
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' 'wasm-unsafe-eval'${scriptExtra} ${SCRIPT_HOSTS}`,
  );
  return directives.join("; ");
}

// Static CSP for public pages — no nonce, since generating one requires
// reading it back via headers() in a layout, which forces that route to full
// dynamic rendering (confirmed via the perf audit: this was defeating every
// public page's ISR cache). Without 'strict-dynamic' to propagate trust,
// 'self' + 'unsafe-inline' + the explicit SCRIPT_HOSTS allowlist do the work
// instead. Same effective allowlist as the nonce-based CSP, just enforced
// differently — no third-party script that worked before is newly blocked.
function buildStaticCsp(): string {
  const isDev = process.env.NODE_ENV !== "production";
  const scriptExtra = isDev ? " 'unsafe-eval'" : "";

  const directives = sharedCspDirectives();
  directives.push(`script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${scriptExtra} ${SCRIPT_HOSTS}`);
  return directives.join("; ");
}

// Nonce-based security headers for routes that need session awareness
// (/admin, /account, /login, /api) — forwards the nonce via a request header
// so the relevant layout can read it via headers() to pass to ThemeProvider /
// GTMScript. Only these routes pay the dynamic-rendering cost of headers().
function withNonceCsp(req: NextRequest): NextResponse {
  const nonce = generateNonce();
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

// Static security headers for public pages — no nonce generated, no request
// header forwarded, so the (public) layout never needs to call headers() and
// stays eligible for ISR/static rendering.
function withStaticCsp(): NextResponse {
  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", buildStaticCsp());
  return response;
}

// Auth.js v5 handler pattern: runs the NextAuth auth check, then calls our
// middleware function. The authorized callback in auth.config.ts only gates
// /admin and /account (everything else returns true immediately) — but
// auth()'s own session/CSRF-cookie machinery runs on *every* request it
// wraps, which sets Set-Cookie even for anonymous visitors. A response with
// Set-Cookie can't be treated as cacheable, so this was forcing every public
// page to a full dynamic SSR render on every request, bypassing each page's
// own `revalidate` ISR window entirely (confirmed via the perf audit: every
// public page returned Cache-Control: private, no-store, x-vercel-cache: MISS).
//
// Fix: only route /admin, /account, /api, and /login through auth() — the
// routes that actually need session awareness. Every other route (the public
// ISR pages) skips NextAuth entirely and gets the static CSP instead, so
// neither Set-Cookie nor a forced headers() read stands between it and ISR.
// This does not change access control at all: the authorized() callback
// already treated every non-admin/account path as unconditionally allowed,
// so no route's gating behavior changes.
const authMiddleware = auth((req) => withNonceCsp(req as NextRequest));

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/api") ||
    pathname === "/login";

  if (needsAuth) {
    return (authMiddleware as (req: NextRequest) => ReturnType<typeof withNonceCsp>)(req);
  }
  return withStaticCsp();
}

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
