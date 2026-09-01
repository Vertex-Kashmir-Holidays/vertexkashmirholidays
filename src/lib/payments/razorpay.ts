import Razorpay from "razorpay";
import { env } from "@/lib/env";

// Shared Razorpay client factory. Every server-side Razorpay call in this repo
// should go through this instead of constructing `new Razorpay({...})` inline
// (previously duplicated in create-order/verify-payment/reconcile) — one place
// to read the key/secret from, matching this repo's stated one-adapter-per-
// external-service convention.

/** True when both server-side Razorpay credentials are present and usable. */
export function isRazorpayConfigured(): boolean {
  return !!env.RAZORPAY_KEY_ID && !env.RAZORPAY_KEY_ID.includes("REPLACE_ME") && !!env.RAZORPAY_SECRET;
}

/** Throws if Razorpay isn't configured — callers should check `isRazorpayConfigured()` first for a graceful error. */
export function getRazorpayClient(): Razorpay {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_SECRET in .env.");
  }
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID!,
    key_secret: env.RAZORPAY_SECRET!,
  });
}
