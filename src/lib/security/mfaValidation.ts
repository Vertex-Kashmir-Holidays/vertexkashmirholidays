// Shared MFA code-format rules — used by both the client forms
// (MfaEnrollForm, MfaChallengeForm) and the server routes
// (/api/admin/mfa/confirm, /api/admin/mfa/verify) so the two can never drift.
// This only validates *shape*; the actual TOTP/recovery-code check always
// happens server-side (src/lib/security/mfaTotp.ts, bcrypt-compare in the
// verify route).

import { z } from "zod";

export const TOTP_CODE_REGEX = /^\d{6}$/;

// Matches generateRecoveryCode() in src/app/api/admin/mfa/confirm/route.ts:
// 12 uppercase hex chars grouped XXXX-XXXX-XXXX.
export const RECOVERY_CODE_REGEX = /^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/;

export const totpCodeSchema = z
  .string()
  .trim()
  .regex(TOTP_CODE_REGEX, "Enter the 6-digit code");

export const recoveryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(RECOVERY_CODE_REGEX, "Enter a valid recovery code");
