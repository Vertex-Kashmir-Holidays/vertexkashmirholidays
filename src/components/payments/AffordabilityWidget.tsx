"use client";

import { motion } from "framer-motion";
import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    RazorpayAffordabilitySuite: new (config: {
      key: string;
      amount: number;
    }) => { render(): void };
  }
}

interface AffordabilityWidgetProps {
  /** Tour / package price in rupees — converted to paise internally. */
  amount: number;
  className?: string;
  title?: string;
}

export function AffordabilityWidget({ amount,
  title = "EMI & payment options", }: AffordabilityWidgetProps) {
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
  const amountPaise = Math.round(amount * 100);
  const initialized = useRef(false);

  function initWidget() {
    if (initialized.current || !key) return;
    if (typeof window === "undefined" || !window.RazorpayAffordabilitySuite) return;
    initialized.current = true;
    new window.RazorpayAffordabilitySuite({ key, amount: amountPaise }).render();
  }

  // Covers the case where the script was already loaded on a prior navigation
  // and won't fire onLoad again (Next.js deduplicates scripts by src).
  useEffect(() => {
    initWidget();
  });

  if (!key) return null;

 return (
    <>
      <Script
        src="https://cdn.razorpay.com/widgets/affordability/affordability.js"
        strategy="afterInteractive"
        onLoad={initWidget}
      />
     <motion.div
        className="mt-14 mx-auto max-w-2xl"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            {title && (
              <p className="mb-4 text-center text-[13.5px] font-bold">
                {title}
              </p>
            )}
            <div className="text-center" id="razorpay-affordability-widget" />
          </div>
      </motion.div>
    </>
  );
}