"use client";

import { useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/icons/brand";
import { useWhatsAppLink } from "@/components/providers/SiteSettingsProvider";
import { trackWhatsappClick } from "@/lib/analytics";

// Mobile-only sticky CTA, shown once the hero form has scrolled out of view.
// Positioning/shadow/safe-area classes mirror src/components/tours/
// BookingMobileBar.tsx exactly, per the Trip Planner mobile spec. Hidden on
// lg+ (desktop keeps the hero form always visible).
export function TripPlannerMobileBar() {
  const [visible, setVisible] = useState(false);
  const wa = useWhatsAppLink();

  useEffect(() => {
    const hero = document.getElementById("trip-planner-form");
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      rootMargin: "-64px 0px 0px 0px",
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-border bg-card/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
      <a
        href="#trip-planner-form"
        className="flex-1 rounded-xl bg-primary py-3 text-center text-[14px] font-bold text-primary-foreground shadow-glow"
      >
        Get My Trip Quote
      </a>
      <a
        href={wa("Hi! I'd like help planning my Kashmir trip.")}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWhatsappClick("lead_form", { sourcePage: "trip-planner" })}
        aria-label="Chat on WhatsApp"
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border text-[#25D366]"
      >
        <WhatsAppIcon className="h-5 w-5" />
      </a>
    </div>
  );
}
