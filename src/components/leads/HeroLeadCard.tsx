"use client";

import { motion } from "framer-motion";
import { LeadForm } from "@/components/leads/LeadForm";
import type { LeadContext, LeadSourcePage } from "@/lib/leads/schema";

interface HeroLeadCardProps {
  source: LeadSourcePage;
  context?: LeadContext;
  /** Card heading; defaults to a generic quote prompt. */
  title?: string;
  subtitle?: string;
  kicker?: string;
  buttonLabel?: string;
  className?: string;
}

// Glass card chrome around the shared <LeadForm /> for the page heroes
// (Tours, Destinations, Blog, Destination-detail). The home hero keeps its own
// portal-bordered wrapper; this gives every other hero a consistent quote card.
export function HeroLeadCard({
  source,
  context,
  title = "Get a free quote in 60 seconds",
  subtitle = "Free, no spam — a real human replies on WhatsApp.",
  kicker = "Plan Your Kashmir Trip",
  buttonLabel,
  className,
}: HeroLeadCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`glass-cream w-full max-w-md rounded-3xl p-6 shadow-glass sm:p-7 ${className ?? ""}`}
    >
      <LeadForm
        source={source}
        context={context}
        kicker={kicker}
        title={title}
        subtitle={subtitle}
        buttonLabel={buttonLabel}
      />
    </motion.div>
  );
}
