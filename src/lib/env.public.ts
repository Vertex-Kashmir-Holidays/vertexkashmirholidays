// Client-safe NEXT_PUBLIC_* environment variables — importable from both
// Server and Client Components, unlike ./env.ts (which reads secrets and
// must never reach the browser bundle).
//
// Each value below is read as a literal `process.env.NEXT_PUBLIC_*`
// expression so Next.js's build-time inlining can statically replace it —
// do not refactor these into a loop or computed-key access, that would
// break inlining for the client bundle.
//
// All optional: every consumer already has its own fallback/guard for an
// unset value (see the file listed next to it) — this module centralizes
// the read, it doesn't change what happens when a value is missing.

export const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL; // consumed via src/lib/seo.ts → SITE_URL, which applies the default
export const NEXT_PUBLIC_TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY; // AuthFormPanel, CampaignHero, ContactForm, LeadForm
export const NEXT_PUBLIC_GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID; // GoogleOneTap
export const NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY; // ContactOfficeMap
export const NEXT_PUBLIC_RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID; // AffordabilityWidget
export const NEXT_PUBLIC_GTM_ID = process.env.NEXT_PUBLIC_GTM_ID; // SiteAnalytics
export const NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION = process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION; // src/app/layout.tsx
