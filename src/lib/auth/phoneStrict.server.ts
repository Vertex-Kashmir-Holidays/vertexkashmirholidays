// Server-only strict phone check. The shared isValidE164 (./validation) uses
// libphonenumber's small default metadata so it can ship in client bundles,
// but that only checks number *length/prefix* — it accepted spam like
// +91 15067145376 (11 digits, matches India's 1xxx toll-free shape). The
// "max" metadata knows the real number ranges and rejects those. It's ~150 KB,
// so it stays on the server; the client keeps the lightweight check.
import "server-only";
import { isValidPhoneNumber } from "libphonenumber-js/max";

export function isValidE164Strict(value: string): boolean {
  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
}
