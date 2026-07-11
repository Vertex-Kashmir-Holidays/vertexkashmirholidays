// Encrypts/decrypts the TOTP secret stored on User.mfaSecret. This must be
// reversible (verification needs the plaintext secret back), so encryption is
// the correct primitive here — unlike a password or OTP code, it is never
// hashed. Key material is derived from the existing AUTH_SECRET (already a
// high-entropy random value required by NextAuth) via SHA-256, so no new
// environment variable is needed.

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12; // recommended IV size for GCM

function encryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set — required to encrypt/decrypt MFA secrets.");
  }
  return createHash("sha256").update(secret).digest();
}

/** Encrypts `plain` (the base32 TOTP secret) into a single stored string: iv:authTag:ciphertext (all hex). */
export function encryptMfaSecret(plain: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), ciphertext.toString("hex")].join(":");
}

/** Reverses {@link encryptMfaSecret}. Throws if the value is malformed or the auth tag doesn't verify. */
export function decryptMfaSecret(stored: string): string {
  const [ivHex, authTagHex, ciphertextHex] = stored.split(":");
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("Malformed encrypted MFA secret.");
  }
  const decipher = createDecipheriv(ALGO, encryptionKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
