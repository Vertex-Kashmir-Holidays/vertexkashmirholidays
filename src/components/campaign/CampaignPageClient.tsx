'use client';

import { useState } from 'react';
import { CampaignUrgencyBar } from '@/components/campaign/CampaignUrgencyBar';
import { CampaignNav } from '@/components/campaign/CampaignNav';
import { CampaignHero } from '@/components/campaign/CampaignHero';
import { CampaignMarquee } from '@/components/campaign/CampaignMarquee';
import { CampaignStats } from '@/components/campaign/CampaignStats';
import { CampaignHighlights } from '@/components/campaign/CampaignHighlights';
import { CampaignFilm } from '@/components/campaign/CampaignFilm';
import { CampaignActivities } from '@/components/campaign/CampaignActivities';
import { CampaignItinerary } from '@/components/campaign/CampaignItinerary';
import { CampaignPricing } from '@/components/campaign/CampaignPricing';
import { CampaignDepartures } from '@/components/campaign/CampaignDepartures';
import { CampaignInclusions } from '@/components/campaign/CampaignInclusions';
import { CampaignGallery } from '@/components/campaign/CampaignGallery';
import { CampaignTestimonials } from '@/components/campaign/CampaignTestimonials';
import { CampaignFAQ } from '@/components/campaign/CampaignFAQ';
import { CampaignFinalCTA } from '@/components/campaign/CampaignFinalCTA';
import { CampaignStickyMobileCTA } from '@/components/campaign/CampaignStickyMobileCTA';
import { CampaignWhatsAppFloat } from '@/components/campaign/CampaignWhatsAppFloat';
import { CampaignFilmModal } from '@/components/campaign/CampaignFilmModal';
import type { CampaignData } from '@/types/campaign';

interface CampaignPageClientProps {
  campaign: CampaignData;
}

export function CampaignPageClient({ campaign }: CampaignPageClientProps) {
  const [filmOpen, setFilmOpen] = useState(false);

  return (
    <div
      className="bg-background font-sans text-foreground antialiased"
      style={
        {
          '--camp-accent': campaign.accent,
          '--camp-accent2': campaign.accent2,
        } as React.CSSProperties
      }
    >
      {campaign.offerText && (
        <CampaignUrgencyBar
          offerText={campaign.offerText}
          deadline={campaign.offerDeadline}
          seats={campaign.offerSeats}
        />
      )}
      <CampaignNav ctaText={campaign.navCta ?? 'Reserve a Seat'} phone={campaign.phone} />
      <CampaignHero
        badge={campaign.badge}
        titleHTML={campaign.titleHtml}
        sub={campaign.sub}
        facts={campaign.facts}
        heroCta={campaign.heroCta ?? 'Reserve My Seat'}
        proofCount={campaign.proofCount}
        filmDur={campaign.filmDuration}
        heroImage={campaign.heroImage}
        heroImageMobile={campaign.heroImageMobile}
        particles={campaign.particles}
        phone={campaign.phone}
        onFilmClick={() => setFilmOpen(true)}
      />
      {campaign.strip.length > 0 && <CampaignMarquee items={campaign.strip} />}
      {campaign.stats.length > 0 && <CampaignStats stats={campaign.stats} />}
      {campaign.highlights.length > 0 && (
        <CampaignHighlights title={campaign.highlightsTitle} highlights={campaign.highlights} />
      )}
      {campaign.filmPoster && (
        <CampaignFilm
          poster={campaign.filmPoster}
          title={campaign.filmTitle}
          dur={campaign.filmDuration}
          onFilmClick={() => setFilmOpen(true)}
        />
      )}
      {campaign.activities.length > 0 && (
        <CampaignActivities title={campaign.activitiesTitle} activities={campaign.activities} />
      )}
      {campaign.itinerary.length > 0 && (
        <CampaignItinerary title={campaign.itineraryTitle} itinerary={campaign.itinerary} />
      )}
      {campaign.tiers.length > 0 && <CampaignPricing tiers={campaign.tiers} />}
      {campaign.batches.length > 0 && <CampaignDepartures batches={campaign.batches} />}
      {(campaign.inclusions.length > 0 || campaign.exclusions.length > 0) && (
        <CampaignInclusions inclusions={campaign.inclusions} exclusions={campaign.exclusions} />
      )}
      {campaign.gallery.length > 0 && (
        <CampaignGallery title={campaign.galleryTitle} images={campaign.gallery} />
      )}
      {campaign.testimonials.length > 0 && (
        <CampaignTestimonials testimonials={campaign.testimonials} />
      )}
      {campaign.faqs.length > 0 && <CampaignFAQ title={campaign.faqsTitle} faqs={campaign.faqs} />}
      <CampaignFinalCTA
        title={campaign.finalTitle}
        sub={campaign.finalSub}
        cta={campaign.finalCta ?? 'Reserve My Seat'}
        note={campaign.finalNote}
        image={campaign.finalImage}
        phone={campaign.phone}
      />
      {campaign.tiers[0] && (
        <CampaignStickyMobileCTA price={campaign.tiers[0].price} cta={campaign.heroCta ?? 'Reserve'} />
      )}
      <CampaignWhatsAppFloat href={campaign.whatsappHref ?? '#'} />

      {campaign.filmSrc && campaign.filmPoster && (
        <CampaignFilmModal
          isOpen={filmOpen}
          onClose={() => setFilmOpen(false)}
          src={campaign.filmSrc}
          poster={campaign.filmPoster}
        />
      )}
    </div>
  );
}
