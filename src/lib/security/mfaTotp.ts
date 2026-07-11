// Thin wrapper around the `otpauth` package (RFC 6238 TOTP) — a well-audited
// library is the right call for a security-critical, easy-to-get-subtly-wrong
// primitive like this, rather than hand-rolled HMAC/time-window code.

import { TOTP, Secret } from "otpauth";

const ISSUER = "Vertex Kashmir Holidays";

function totpFor(secretBase32: string, accountLabel: string): TOTP {
  return new TOTP({
    issuer: ISSUER,
    label: accountLabel,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });
}

/** Generates a new random base32 secret (160-bit, the standard TOTP size). */
export function generateMfaSecret(): string {
  return new Secret({ size: 20 }).base32;
}

/** Builds the `otpauth://` URI an authenticator app scans as a QR code. */
export function buildOtpauthUrl(secretBase32: string, accountLabel: string): string {
  return totpFor(secretBase32, accountLabel).toString();
}

/**
 * Validates a 6-digit code against the secret, tolerating one 30s step of
 * clock drift on either side (window: 1). Returns true/false — callers don't
 * need the drift offset `validate()` normally returns.
 */
export function verifyTotp(secretBase32: string, code: string, accountLabel: string): boolean {
  const delta = totpFor(secretBase32, accountLabel).validate({ token: code, window: 1 });
  return delta !== null;
}
