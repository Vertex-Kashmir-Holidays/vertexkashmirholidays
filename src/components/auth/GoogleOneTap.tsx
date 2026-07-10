"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { resolveAuthDestination } from "@/lib/auth/destination";

// Minimal shape of the Google Identity Services global this script attaches —
// only the members this component actually calls.
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

const SCRIPT_ID = "google-one-tap-client";

interface GoogleOneTapProps {
  /** CSP nonce for this request — required for the injected <script> to run. */
  nonce?: string;
}

// Google One Tap: shows Google's own auto-prompt overlay (no button click
// needed) using the Identity Services script, and posts the resulting signed
// ID token to the "google-one-tap" Credentials provider in src/lib/auth.ts,
// which verifies it and applies the exact same customer-only/staff-blocked
// rule as the "Continue with Google" button. Purely additive — the button
// keeps working if this silently fails (unsupported browser, no Google
// session, dismissed, etc.), so failures here are never surfaced as errors.
export function GoogleOneTap({ nonce }: GoogleOneTapProps) {
  const router = useRouter();
  const signingInRef = useRef(false);

  useEffect(() => {
    const clientId: string | undefined = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    const googleClientId: string = clientId;

    let cancelled = false;

    async function handleCredential(response: { credential: string }) {
      if (signingInRef.current) return;
      signingInRef.current = true;

      const result = await signIn("google-one-tap", {
        credential: response.credential,
        redirect: false,
      });

      if (cancelled) return;

      if (result?.error) {
        // Silent by design — the password form and the button remain available.
        signingInRef.current = false;
        return;
      }

      router.push(resolveAuthDestination());
      router.refresh();
    }

    function init() {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
      });
      window.google.accounts.id.prompt();
    }

    if (window.google) {
      init();
    } else {
      const existing = document.getElementById(SCRIPT_ID);
      if (existing) {
        existing.addEventListener("load", init, { once: true });
      } else {
        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        if (nonce) script.setAttribute("nonce", nonce);
        script.addEventListener("load", init, { once: true });
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      window.google?.accounts.id.cancel();
    };
  }, [nonce, router]);

  return null;
}
