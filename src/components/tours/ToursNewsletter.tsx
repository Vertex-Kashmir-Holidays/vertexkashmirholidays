"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { imgSrc } from "@/lib/placeholder";

export function ToursNewsletter() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const subscribe = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Subscription failed. Please try again.");
        return;
      }
      toast.success("You're subscribed! Watch your inbox for deals.");
      setEmail("");
    } catch {
      toast.error("Subscription failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image src={imgSrc()} alt="" fill sizes="100vw" className="object-cover" />
      </motion.div>
      <div className="absolute inset-0 bg-brand-green/90"></div>
      <div className="relative mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 px-4 py-10 sm:px-6 sm:py-12">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="h-display text-[18px] font-bold text-white">Don't miss our best deals!</h2>
          <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-white/80">
            Subscribe to get early access to exclusive offers and Kashmir travel tips.
          </p>
        </motion.div>
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex overflow-hidden rounded-lg bg-card p-1 shadow-card">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && subscribe()}
              className="w-full bg-transparent px-4 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Enter your email address"
            />
            <motion.button
              onClick={subscribe}
              disabled={submitting}
              className="shrink-0 rounded-md bg-brand-bright px-5 py-3 text-[14px] font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {submitting ? "Subscribing…" : "Subscribe Now"}
            </motion.button>
          </div>
          <p className="mt-2.5 text-[12px] text-white/70">No spam. Unsubscribe anytime.</p>
        </motion.div>
      </div>
    </section>
  );
}
