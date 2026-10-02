"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";

// Email signup for the blog sidebars (/blog and each post) — posts to
// /api/newsletter, then swaps to a success message; failures show inline.
export function NewsletterSignupForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Subscription failed. Please try again.");
      }
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Subscription failed. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <p
        role="status"
        className="mt-4 flex items-center gap-1.5 text-[14px] font-semibold text-primary"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2.2} />
        You&apos;re subscribed — watch your inbox for Kashmir tips.
      </p>
    );
  }

  return (
    <form className="mt-4 space-y-2.5" onSubmit={handleSubmit}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={error ? true : undefined}
        className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-[14px] text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
        placeholder="Enter your email"
      />
      <motion.button
        type="submit"
        disabled={status === "loading"}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-[14px] font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        {status === "loading" ? "Subscribing…" : "Subscribe"}
      </motion.button>
      {error && (
        <p role="alert" className="text-[12px] font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
