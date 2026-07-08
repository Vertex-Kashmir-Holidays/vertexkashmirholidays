"use client";

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
    <div
      className={`hero-reveal glass-cream w-full max-w-md rounded-3xl p-6 shadow-glass sm:p-7 ${className ?? ""}`}
      style={{ "--hr-y": "16px", "--hr-delay": "0.4s", "--hr-duration": "0.7s" } as React.CSSProperties}
    >
      <LeadForm
        source={source}
        context={context}
        kicker={kicker}
        title={title}
        subtitle={subtitle}
        buttonLabel={buttonLabel}
      />
    </div>
  );
}
