// Centralized, validated access to server-side environment variables.
//
// Server-only — never import this from a "use client" component (it reads
// secrets). Client components that need a NEXT_PUBLIC_* value import from
// `./env.public` instead, which is safe for the browser bundle.
//
// Only DATABASE_URL and AUTH_SECRET are actually required — the app cannot
// serve a single request without a database connection or a session-signing
// secret, so those two fail loudly the moment this module is first imported,
// instead of surfacing later as an opaque Prisma "Environment variable not
// found" schema error or a silent NextAuth-generated ephemeral secret.
//
// Every other variable here is optional by design: each of its consumers
// already degrades gracefully when unset (Cloudinary → local disk uploads,
// Turnstile → verification skipped, Upstash → in-memory rate limiting,
// Razorpay → a clear 400 at the API boundary, offline-conversion adapters →
// no-op via their own isConfigured() checks) — see
// ../../.ai/instructions/coding-standards.md → Integration Standards. This
// module exists to type and centralize those reads, not to newly require
// them; adding a var here must not change whether its feature degrades
// gracefully.
import { z } from "zod";

// Required vars and the message shown when one is missing/empty. Checked
// manually (not via Zod's `.min()`) because Zod's built-in "expected string,
// received undefined" type error otherwise pre-empts any custom message
// attached to a refinement when the key is absent from process.env entirely
// — a completely-missing var never even reaches `.min()`'s check.
const REQUIRED: Record<"DATABASE_URL" | "AUTH_SECRET", string> = {
  DATABASE_URL: "DATABASE_URL is required (Postgres connection string) — set it in .env.local for dev, or in the deployment platform's environment variables for Preview/Production.",
  AUTH_SECRET: "AUTH_SECRET is required (session signing secret) — generate with `npx auth secret` and set it in .env.local for dev, or in the deployment platform's environment variables for Preview/Production.",
};

const schema = z.object({
  // ── Required (existence enforced by checkRequired() below, not Zod) ─────
  DATABASE_URL: z.string(),
  AUTH_SECRET: z.string(),

  // Legacy/secondary base URL used only as a fallback for transactional email
  // links (src/lib/mail.ts, src/lib/notifications.ts) — distinct from
  // AUTH_URL by design, see src/lib/auth.config.ts's trustHost comment.
  NEXTAUTH_URL: z.string().optional(),

  // ── Cloudinary (media storage) ───────────────────────────────────────────
  CLOUDINARY_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().optional(),

  // ── Cron ──────────────────────────────────────────────────────────────
  CRON_SECRET: z.string().optional(),

  // ── Razorpay ──────────────────────────────────────────────────────────
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),

  // ── SMTP / Email ──────────────────────────────────────────────────────
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  MAIL_TO_ADMIN: z.string().optional(),
  MAIL_REPLY_TO: z.string().optional(),
  LEADS_EMAIL: z.string().optional(),
  BOOKING_EMAIL: z.string().optional(),

  // ── Turnstile (CAPTCHA) ──────────────────────────────────────────────
  TURNSTILE_SECRET_KEY: z.string().optional(),

  // ── Upstash (rate limiting) ──────────────────────────────────────────
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // ── Google OAuth ──────────────────────────────────────────────────────
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // ── Google Places (live reviews) ─────────────────────────────────────
  GOOGLE_PLACES_API_KEY: z.string().optional(),

  // ── JaaS (Vertex Connect meetings) ───────────────────────────────────
  JAAS_APP_ID: z.string().optional(),
  JAAS_KEY_ID: z.string().optional(),
  JAAS_PRIVATE_KEY: z.string().optional(),

  // ── Google Ads offline conversions ───────────────────────────────────
  GOOGLE_ADS_DEVELOPER_TOKEN: z.string().optional(),
  GOOGLE_ADS_REFRESH_TOKEN: z.string().optional(),
  GOOGLE_ADS_LOGIN_CUSTOMER_ID: z.string().optional(),
  GOOGLE_ADS_CUSTOMER_ID: z.string().optional(),
  GOOGLE_ADS_CONVERSION_ACTION_ID: z.string().optional(),

  // ── Meta Conversions API ─────────────────────────────────────────────
  META_CAPI_PIXEL_ID: z.string().optional(),
  META_CAPI_ACCESS_TOKEN: z.string().optional(),
  META_CAPI_TEST_EVENT_CODE: z.string().optional(),

  // ── Microsoft/Bing Ads (scaffold, not yet wired — see tech-stack.md) ──
  MICROSOFT_ADS_CLIENT_ID: z.string().optional(),
  MICROSOFT_ADS_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_ADS_REFRESH_TOKEN: z.string().optional(),
  MICROSOFT_ADS_DEVELOPER_TOKEN: z.string().optional(),
  MICROSOFT_ADS_CUSTOMER_ID: z.string().optional(),
  MICROSOFT_ADS_CONVERSION_ID: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

function checkRequired(): void {
  const missing = (Object.keys(REQUIRED) as (keyof typeof REQUIRED)[]).filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    const problems = missing.map((key) => `  - ${REQUIRED[key]}`).join("\n");
    throw new Error(
      `\n\nMissing required environment variable(s):\n${problems}\n\nCheck .env.local against .env.example, or the deployment platform's environment variable settings.\n`,
    );
  }
}

function loadEnv(): Env {
  checkRequired();
  // Every other field is `.optional()`, so this only fails on a genuine type
  // mismatch (shouldn't happen — process.env values are always strings).
  return schema.parse(process.env);
}

export const env = loadEnv();
