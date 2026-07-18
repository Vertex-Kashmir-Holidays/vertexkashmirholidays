// Pure, shared validation used by BOTH the client form and the server routes.
// No server-only imports (no prisma/bcrypt) so this is safe to bundle into a
// client component. The OTP/crypto/rate-limit helpers live in ./otp.

import { isValidPhoneNumber, parsePhoneNumber, type CountryCode } from "libphonenumber-js";

// ── Email domain allowlist ───────────────────────────────────────────────────

/** The company's own email domain — staff accounts, never a Google sign-in target. */
export const COMPANY_EMAIL_DOMAIN = "vertexkashmirholidays.com";

/** Public providers we accept registrations from. Everything else is blocked. */
export const ALLOWED_EMAIL_DOMAINS = [
  // Google
  "gmail.com",
  "googlemail.com",
  // Microsoft (Outlook / Hotmail / Live)
  "outlook.com",
  "hotmail.com",
  "live.com",
  // Yahoo
  "yahoo.com",
  "ymail.com",
  // Zoho
  "zoho.com",
  "zohomail.com",
  // Rediffmail
  "rediffmail.com",
  // Company
  COMPANY_EMAIL_DOMAIN,
] as const;

/** True when the email's domain is in {@link ALLOWED_EMAIL_DOMAINS}. */
export function isAllowedEmailDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  return !!domain && (ALLOWED_EMAIL_DOMAINS as readonly string[]).includes(domain);
}

/**
 * True for public-provider domains only — excludes the company domain. Google
 * sign-in is a customer convenience login, never a staff auth path, so it must
 * never accept @{@link COMPANY_EMAIL_DOMAIN} even though that domain is allowed
 * for ordinary (password) registration.
 */
export function isAllowedGoogleDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  return !!domain && domain !== COMPANY_EMAIL_DOMAIN && isAllowedEmailDomain(email);
}

// Generic, non-enumerating message — we deliberately do NOT list every allowed
// domain (that just hands attackers/scrapers the full set).
export const PUBLIC_DOMAINS_GENERIC_MESSAGE =
  "Please use a public email provider (e.g. Gmail, Outlook, Yahoo).";

// ── Email format ─────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export const EMAIL_FORMAT_MESSAGE = "Please enter a valid email address.";

// ── Password policy ──────────────────────────────────────────────────────────
//
// At least 8 characters and must contain BOTH letters and numbers. Other
// characters (symbols) are allowed — they only make a password stronger.

export const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export function isValidPassword(pw: string): boolean {
  return PASSWORD_RE.test(pw);
}

export const PASSWORD_MESSAGE =
  "Password must be at least 8 characters and include both letters and numbers.";

// ── Phone (country-aware via libphonenumber-js) ──────────────────────────────

/** Validates a national number against the selected country. */
export function isValidPhone(national: string, country: CountryCode): boolean {
  if (!national.trim()) return false;
  try {
    return isValidPhoneNumber(national, country);
  } catch {
    return false;
  }
}

/** Converts a national number + country to E.164 (e.g. +919876543210), or null. */
export function toE164(national: string, country: CountryCode): string | null {
  try {
    const parsed = parsePhoneNumber(national, country);
    return parsed?.isValid() ? parsed.number : null;
  } catch {
    return null;
  }
}

/** Validates an already-formatted E.164 string (country embedded). */
export function isValidE164(value: string): boolean {
  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
}

export const PHONE_MESSAGE = "Please enter a valid phone number for the selected country.";
