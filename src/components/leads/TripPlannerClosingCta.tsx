"use client";

import { WhatsAppIcon } from "@/components/icons/brand";
import { useWhatsAppLink } from "@/components/providers/SiteSettingsProvider";
import { trackWhatsappClick } from "@/lib/analytics";

// Closing "Still deciding? Chat with us on WhatsApp" button. Same wa()
// link + attribution tag as every other WhatsApp CTA on the page.
export function TripPlannerClosingCta({ message }: { message: string }) {
  const wa = useWhatsAppLink();

  return (
    <a
      href={wa(message)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackWhatsappClick("trip_planner_closing_cta", { sourcePage: "trip-planner" })}
      className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-glow ring-inner transition hover:brightness-110"
    >
      <WhatsAppIcon className="h-4 w-4" />
      Chat on WhatsApp
    </a>
  );
}
