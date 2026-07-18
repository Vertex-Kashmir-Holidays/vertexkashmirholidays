// src/components/sections/TourDetailsRelatedTours.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TourCard } from "@/components/ui/TourCard";
import { useSiteSettings, useWhatsAppLink } from "@/components/providers/SiteSettingsProvider";

interface RelatedTourCard {
  tour: React.ComponentProps<typeof TourCard>["tour"];
  ctaSentence: string;
}

interface TourDetailsRelatedToursProps {
  relatedTours: RelatedTourCard[];
  whyVertexBlurb?: string;
  ctaHeadline?: string;
  ctaBody?: string;
  tourName: string;
  tourSlug: string;
}

export function TourDetailsRelatedTours({
  relatedTours,
  whyVertexBlurb,
  ctaHeadline,
  ctaBody,
  tourName,
  tourSlug,
}: TourDetailsRelatedToursProps) {
  const { siteName } = useSiteSettings();
  const wa = useWhatsAppLink();
  const hasRelated = relatedTours.length > 0;
  const hasClosing = Boolean(whyVertexBlurb || ctaHeadline || ctaBody);
  if (!hasRelated && !hasClosing) return null;

  const whatsappHref = wa(
    `Hi ${siteName}! I'm interested in the "${tourName}" Kashmir package. Could you share details and availability?`,
  );

  return (
    <>
      {hasRelated && (
        <motion.section
          id="related"
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-[18px] font-bold">You Might Also Like</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {relatedTours.map((entry, i) => (
              <div key={entry.tour.detailHref ?? i}>
                <TourCard tour={entry.tour} index={i} variant="tours" />
                {entry.ctaSentence && (
                  <p className="mt-2.5 text-[14px] italic leading-relaxed text-foreground/65">
                    {entry.ctaSentence}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {hasClosing && (
        <motion.section
          id="closing-cta"
          className="mt-6 rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {whyVertexBlurb && (
            <p className="mx-auto max-w-2xl text-[14px] leading-relaxed text-foreground/70">
              {whyVertexBlurb}
            </p>
          )}
          {ctaHeadline && <h2 className="mt-4 text-[18px] font-bold">{ctaHeadline}</h2>}
          {ctaBody && (
            <p className="mx-auto mt-2 max-w-2xl text-[14px] leading-relaxed text-foreground/70">
              {ctaBody}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-primary/30 bg-primary/10 px-5 py-2.5 text-[14px] font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              WhatsApp Us
            </Link>
            <Link
              href={`/booking?tour=${tourSlug}`}
              className="rounded-lg bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Enquire Now
            </Link>
          </div>
        </motion.section>
      )}
    </>
  );
}
