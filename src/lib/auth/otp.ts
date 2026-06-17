// Email-OTP helpers for secure account registration.
//
// The account is only created in `User` AFTER the OTP is verified. Until then a
// pending row lives in `EmailOtp` with the chosen password already bcrypt-hashed
// and the OTP stored as a bcrypt hash (never plaintext). See the API routes
// under src/app/api/auth/register/{request-otp,verify-otp}.

import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Email-domain + password + phone validation now lives in ./validation (it is
// pure and shared with the client form). Re-export the domain helpers here so
// existing server imports keep working.
export {
  ALLOWED_EMAIL_DOMAINS,
  isAllowedEmailDomain,
  PUBLIC_DOMAINS_GENERIC_MESSAGE,
} from "./validation";

// ── Policy constants ─────────────────────────────────────────────────────────

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 10 * 60 * 1000; // OTP valid for 10 minutes
export const RESEND_COOLDOWN_MS = 60 * 1000; // min 60s between code requests
export const MAX_VERIFY_ATTEMPTS = 5; // wrong-code attempts before lockout

export const OTP_TTL_MINUTES = OTP_TTL_MS / 60_000;
export const RESEND_COOLDOWN_SECONDS = RESEND_COOLDOWN_MS / 1_000;

// ── OTP generation & hashing ─────────────────────────────────────────────────

/** Cryptographically-secure, zero-padded 6-digit code (000000–999999). */
export function generateOtp(): string {
  return randomInt(0, 1_000_000)
    .toString()
    .padStart(OTP_LENGTH, "0");
}

export function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export function verifyOtpHash(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

// ── Cleanup ──────────────────────────────────────────────────────────────────

/** Best-effort removal of expired pending OTP rows. Called on each request. */
export async function cleanupExpiredOtps(): Promise<void> {
  try {
    await prisma.emailOtp.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  } catch (err) {
    // Cleanup is non-critical — never let it break the request flow.
    console.error("[otp] cleanup failed:", err);
  }
}

// ── Lightweight in-memory rate limiter ───────────────────────────────────────
//
// Defence-in-depth on top of the per-email cooldown enforced in the DB. Keyed by
// IP+purpose. Note: in-memory state is per-instance and resets on redeploy, so
// the DB cooldown remains the authoritative anti-spam guard.

const hits = new Map<string, { count: number; resetAt: number }>();

/** Returns false when `key` has exceeded `limit` requests within `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count += 1;
  return true;
}

/** Extracts a best-effort client IP from forwarding headers. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
