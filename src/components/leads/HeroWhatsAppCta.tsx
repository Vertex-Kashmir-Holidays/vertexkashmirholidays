"use client";

import { WhatsAppIcon } from "@/components/icons/brand";
import { useWhatsAppLink } from "@/components/providers/SiteSettingsProvider";
import { trackWhatsappClick } from "@/lib/analytics";
import type { WhatsAppSource } from "@/types/analytics";

interface HeroWhatsAppCtaProps {
  message: string;
  source: WhatsAppSource;
  sourcePage: string;
  label?: string;
}

// Secondary path in a hero's content column — the form/lead card (in the
// aside) stays the primary CTA; this is a glass/outlined pill, never
// filled/competing with the form's own CTA button, per the established
// WhatsApp-is-secondary hierarchy (see LeadForm's own outlined "Or chat on
// WhatsApp" row). Carries the same attribution tag every other WhatsApp CTA
// on the site does (useWhatsAppLink() already appends it automatically).
export function HeroWhatsAppCta({
  message,
  source,
  sourcePage,
  label = "Chat With Our Kashmir Team",
}: HeroWhatsAppCtaProps) {
  const wa = useWhatsAppLink();

  return (
    <a
      href={wa(message)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackWhatsappClick(source, { sourcePage })}
      className="hero-reveal glass mt-6 inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-[14px] font-bold text-white transition hover:scale-[1.03] hover:bg-white/15"
      style={{ "--hr-y": "20px", "--hr-delay": "0.3s" } as React.CSSProperties}
    >
      <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
      {label}
    </a>
  );
}
