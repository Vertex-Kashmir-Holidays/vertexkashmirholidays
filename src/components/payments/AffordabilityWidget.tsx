"use client";

import { motion } from "framer-motion";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { NEXT_PUBLIC_RAZORPAY_KEY_ID } from "@/lib/env.public";

declare global {
  interface Window {
    RazorpayAffordabilitySuite: new (config: { key: string; amount: number }) => { render(): void };
  }
}

interface AffordabilityWidgetProps {
  /** Tour / package price in rupees — converted to paise internally. */
  amount: number;
  className?: string;
  title?: string;
}

export function AffordabilityWidget({
  amount,
  title = "Easy EMI Available",
}: AffordabilityWidgetProps) {
  const key = NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
  const amountPaise = Math.round(amount * 100);
  const initialized = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Gates loading affordability.js (and the third-party cookies it sets)
  // until the widget is actually about to scroll into view — visitors who
  // never scroll this far never load it at all.
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!key || shouldLoad) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [key, shouldLoad]);

  function initWidget() {
    if (initialized.current || !key) return;
    if (typeof window === "undefined" || !window.RazorpayAffordabilitySuite) return;
    initialized.current = true;
    new window.RazorpayAffordabilitySuite({ key, amount: amountPaise }).render();
  }

  // Covers the case where the script was already loaded on a prior navigation
  // and won't fire onLoad again (Next.js deduplicates scripts by src).
  useEffect(() => {
    if (shouldLoad) initWidget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldLoad, key, amountPaise]);

  if (!key) return null;

  return (
    <>
      {shouldLoad && (
        <Script
          src="https://cdn.razorpay.com/widgets/affordability/affordability.js"
          strategy="afterInteractive"
          onLoad={initWidget}
        />
      )}
      <motion.div
        ref={containerRef}
        className="mt-6 mx-auto max-w-2xl"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          {title && <p className="mb-4 text-center text-[14px] font-bold">{title}</p>}
          <div className="text-center" id="razorpay-affordability-widget" />
        </div>
      </motion.div>
    </>
  );
}
