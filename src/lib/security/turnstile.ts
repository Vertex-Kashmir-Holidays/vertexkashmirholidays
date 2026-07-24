// Cloudflare Turnstile server-side verification.
//
// Graceful degradation: when TURNSTILE_SECRET_KEY is unset (local dev, or before
// keys are provisioned) verification is SKIPPED so flows keep working. In
// production, set the secret to enforce. The client widget is likewise only
// rendered when NEXT_PUBLIC_TURNSTILE_SITE_KEY is present.

import { env } from "@/lib/env";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** True when the secret is configured and verification will be enforced. */
export function turnstileEnforced(): boolean {
  return Boolean(env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(
  token: string | undefined | null,
  ip?: string,
): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY;
  // Not configured → don't block (dev/preview). A one-time warn aids diagnosis.
  if (!secret) {
    if (!warned) {
      console.warn("[turnstile] TURNSTILE_SECRET_KEY unset — CAPTCHA NOT enforced");
      warned = true;
    }
    return true;
  }
  if (!token) return false;

  try {
    const form = new URLSearchParams({ secret, response: token });
    if (ip) form.set("remoteip", ip);
    const res = await fetch(VERIFY_URL, { method: "POST", body: form });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("[turnstile] verification request failed:", err);
    return false;
  }
}

let warned = false;
