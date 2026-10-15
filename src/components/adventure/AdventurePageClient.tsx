"use client";

import { useState } from "react";
import { AdventureUrgencyBar } from "@/components/adventure/AdventureUrgencyBar";
import { AdventureNav } from "@/components/adventure/AdventureNav";
import { AdventureHero } from "@/components/adventure/AdventureHero";
import { AdventureMarquee } from "@/components/adventure/AdventureMarquee";
import { AdventureStats } from "@/components/adventure/AdventureStats";
import { AdventureHighlights } from "@/components/adventure/AdventureHighlights";
import { AdventureFilm } from "@/components/adventure/AdventureFilm";
import { AdventureActivities } from "@/components/adventure/AdventureActivities";
import { AdventureItinerary } from "@/components/adventure/AdventureItinerary";
import { AdventurePricing } from "@/components/adventure/AdventurePricing";
import { AdventureDepartures } from "@/components/adventure/AdventureDepartures";
import { AdventureInclusions } from "@/components/adventure/AdventureInclusions";
import { AdventureGallery } from "@/components/adventure/AdventureGallery";
import { AdventureTestimonials } from "@/components/adventure/AdventureTestimonials";
import { AdventureFAQ } from "@/components/adventure/AdventureFAQ";
import { AdventureFinalCTA } from "@/components/adventure/AdventureFinalCTA";
import { AdventureStickyMobileCTA } from "@/components/adventure/AdventureStickyMobileCTA";
import { AdventureWhatsAppFloat } from "@/components/adventure/AdventureWhatsAppFloat";
import { AdventureFilmModal } from "@/components/adventure/AdventureFilmModal";
import { useSiteSettings, useWhatsAppLink } from "@/components/providers/SiteSettingsProvider";
import { Footer, type FooterSettings } from "@/components/layout/Footer";
import type { AdventureData } from "@/types/adventure";

interface AdventurePageClientProps {
  adventure: AdventureData;
  footerSettings?: FooterSettings | null;
  corporateOffice?: { name: string; address: string } | null;
}

export function AdventurePageClient({
  adventure,
  footerSettings,
  corporateOffice,
}: AdventurePageClientProps) {
  const [filmOpen, setFilmOpen] = useState(false);
  // Pricing tier picked via a "Choose" button — sent with the hero form's lead.
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  // Phone shown in the nav / hero / final CTA: this adventure's own number if
  // set, otherwise the site number from Settings.
  const { sitePhone } = useSiteSettings();
  const phone = adventure.phone || sitePhone || null;

  // WhatsApp CTA: use this adventure's own link if set, otherwise the site
  // number — with an adventure-specific prefilled message.
  const wa = useWhatsAppLink();
  const whatsappHref =
    adventure.whatsappHref && adventure.whatsappHref !== "#"
      ? adventure.whatsappHref
      : wa(
          `Hi! I'm interested in the "${adventure.name}" Kashmir offer. Please share details, pricing and availability.`,
        );

  return (
    <div
      className="bg-background font-sans text-foreground antialiased"
      style={
        {
          "--adventure-accent": adventure.accent,
          "--adventure-accent2": adventure.accent2,
        } as React.CSSProperties
      }
    >
      {adventure.offerText && (
        <AdventureUrgencyBar
          offerText={adventure.offerText}
          deadline={adventure.offerDeadline}
          seats={adventure.offerSeats}
        />
      )}
      <AdventureNav ctaText={adventure.navCta ?? "Reserve a Seat"} phone={phone} />
      <AdventureHero
        slug={adventure.slug}
        name={adventure.name}
        badge={adventure.badge}
        titleHTML={adventure.titleHtml}
        sub={adventure.sub}
        facts={adventure.facts}
        heroCta={adventure.heroCta ?? "Reserve My Seat"}
        proofCount={adventure.proofCount}
        formCta={adventure.formCta ?? "Reserve My Seat →"}
        selectedTier={selectedTier}
        onClearTier={() => setSelectedTier(null)}
        filmDur={adventure.filmDuration}
        heroImage={adventure.heroImage}
        heroImageMobile={adventure.heroImageMobile}
        particles={adventure.particles}
        phone={phone}
        onFilmClick={() => setFilmOpen(true)}
      />
      {adventure.strip.length > 0 && <AdventureMarquee items={adventure.strip} />}
      {adventure.stats.length > 0 && <AdventureStats stats={adventure.stats} />}
      {adventure.highlights.length > 0 && (
        <AdventureHighlights title={adventure.highlightsTitle} highlights={adventure.highlights} />
      )}
      {adventure.filmPoster && (
        <AdventureFilm
          poster={adventure.filmPoster}
          title={adventure.filmTitle}
          dur={adventure.filmDuration}
          onFilmClick={() => setFilmOpen(true)}
        />
      )}
      {adventure.activities.length > 0 && (
        <AdventureActivities title={adventure.activitiesTitle} activities={adventure.activities} />
      )}
      {adventure.itinerary.length > 0 && (
        <AdventureItinerary title={adventure.itineraryTitle} itinerary={adventure.itinerary} />
      )}
      {adventure.tiers.length > 0 && (
        <AdventurePricing
          tiers={adventure.tiers}
          kicker={adventure.pricingKicker}
          title={adventure.pricingTitle}
          paymentNote={adventure.paymentNote}
          onChoose={setSelectedTier}
        />
      )}
      {adventure.batches.length > 0 && <AdventureDepartures batches={adventure.batches} />}
      {(adventure.inclusions.length > 0 || adventure.exclusions.length > 0) && (
        <AdventureInclusions inclusions={adventure.inclusions} exclusions={adventure.exclusions} />
      )}
      {adventure.gallery.length > 0 && (
        <AdventureGallery title={adventure.galleryTitle} images={adventure.gallery} />
      )}
      {adventure.testimonials.length > 0 && (
        <AdventureTestimonials testimonials={adventure.testimonials} />
      )}
      {adventure.faqs.length > 0 && <AdventureFAQ title={adventure.faqsTitle} faqs={adventure.faqs} />}
      <AdventureFinalCTA
        title={adventure.finalTitle}
        sub={adventure.finalSub}
        cta={adventure.finalCta ?? "Reserve My Seat"}
        note={adventure.finalNote}
        image={adventure.finalImage}
        phone={phone}
      />
      {adventure.tiers[0] && (
        <AdventureStickyMobileCTA
          price={adventure.tiers[0].price}
          cta={adventure.heroCta ?? "Reserve"}
        />
      )}
      <AdventureWhatsAppFloat href={whatsappHref} />

      <Footer settings={footerSettings} corporateOffice={corporateOffice ?? null} />

      {adventure.filmSrc && adventure.filmPoster && (
        <AdventureFilmModal
          isOpen={filmOpen}
          onClose={() => setFilmOpen(false)}
          src={adventure.filmSrc}
          poster={adventure.filmPoster}
        />
      )}
    </div>
  );
}
