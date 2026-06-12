// src/app/(public)/campaign/[slug]/page.tsx
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

export default function CampaignPage() {
  const [filmOpen, setFilmOpen] = useState(false);

  const campaign = {
    accent: 'hsl(196 90% 52%)',
    accent2: 'hsl(170 80% 50%)',
    particles: 'snow' as const,
    name: 'Gulmarg Winter Ski Week',
    badge: '❄️ WINTER 2027 · LIMITED DEPARTURES',
    titleHTML: 'Learn to ski on Asia\'s <span class="grad-accent-text italic">best powder</span> — in 6 days',
    sub: 'Certified instructors, all gear included, and the Gulmarg Gondola at your doorstep. Built for absolute beginners and rusty intermediates.',
    heroSeed: 'camp-ski-hero',
    finalSeed: 'camp-ski-final',
    facts: ['6D / 5N', 'Gulmarg', 'Beginner-friendly', 'Max 12 / batch', 'Jan – Mar'],
    heroCta: 'Reserve My Ski Week',
    proofCount: '2,100+',
    offer: {
      text: '🔥 Early-bird: ₹4,000 off ends',
      deadline: '2026-06-30T23:59:59+05:30',
      seats: 'Only 12 seats per batch',
    },
    form: {
      eyebrow: 'SKI WEEK 2027',
      title: 'Get the full ski-week plan on WhatsApp',
      cta: 'Send Me the Plan',
    },
    strip: [
      '❄️ Fresh powder daily',
      '⛷️ ISIA-certified instructors',
      '🚡 Gondola at the doorstep',
      '🏨 Heated slope-side stay',
      '📸 Photographer on every batch',
      '🔒 Razorpay secured',
      '✅ J&K licensed',
    ],
    stats: [
      ['2100', '+', 'Skiers taught'],
      ['96', '%', 'Stand-up rate by day 3'],
      ['4.9', '★', 'Average rating'],
      ['12', '', 'Max batch size'],
    ] as Array<[string, string, string]>,
    film: {
      title: 'Six days in Gulmarg powder',
      dur: '1:48',
      posterSeed: 'film-ski',
      src: 'media/ski-film.mp4',
    },
    hlTitle: 'Why 2,100+ people learned skiing with us',
    highlights: [
      { seed: 'hl-ski-school', emoji: '⛷️', title: 'Ski School Included', description: '4 days of certified instruction — gear, lift passes, the lot.' },
      { seed: 'hl-gondola', emoji: '🚡', title: 'Gondola Phase 1 & 2', description: 'Ride to 3,980 m on Apharwat. Powder bowls most resorts dream of.' },
      { seed: 'hl-hotel', emoji: '🏨', title: 'Slope-side Stay', description: 'Cosy heated hotel 5 minutes from the beginner slopes.' },
      { seed: 'hl-photo', emoji: '📸', title: 'Trip Photographer', description: 'Every batch travels with a photographer. Reels included.' },
    ],
    activities: [
      ['act-ski-lesson', 'Daily Ski Lessons'],
      ['act-gondola', 'Gondola Summit Ride'],
      ['act-sledge', 'Sledging & Snow Games'],
      ['act-bonfire', 'Bonfire + Wazwan Night'],
      ['act-snowshoe', 'Snowshoe Forest Walk'],
      ['act-igloo', 'Igloo Café Visit'],
    ] as Array<[string, string]>,
    itnTitle: 'Your 6 days on snow',
    itinerary: [
      { title: 'Arrive Srinagar → Gulmarg', description: 'Airport pickup, scenic 2-hr drive, gear fitting & welcome kahwa by the bukhari.', image: 'itn-ski1' },
      { title: 'Ski School Day 1', description: 'Boots, balance and your first glides on the beginner slope. Evening snow walk.', image: 'itn-ski2' },
      { title: 'Ski School Day 2', description: 'Turning and stopping with confidence. Afternoon sledging & snowball league.', image: 'itn-ski3' },
      { title: 'Ski School Day 3', description: 'Button lift laps on longer runs. Bonfire night with live wazwan dinner.', image: 'itn-ski4' },
      { title: 'Gondola Summit Day', description: 'Phase 1 & 2 to Apharwat (3,980 m). Intermediates ski; beginners snow-play & photos.', image: 'itn-ski5' },
      { title: 'Departure', description: 'Certificate ceremony, brunch, and drop at Srinagar airport by 1 PM.', image: 'itn-ski6' },
    ],
    tiers: [
      {
        name: 'Standard',
        price: '₹28,999',
        old: '₹32,999',
        tag: '',
        desc: 'Shared twin rooms, full ski school',
        feats: ['5N heated hotel stay', '4-day ski school + gear', 'All meals (B+D)', 'Gondola Phase 1', 'Airport transfers'],
      },
      {
        name: 'Deluxe',
        price: '₹36,999',
        old: '₹40,999',
        tag: 'MOST POPULAR',
        desc: 'Premium stay + summit day',
        feats: ['Everything in Standard', 'Premium hotel upgrade', 'Gondola Phase 2 (summit)', 'Trip photographer access', 'Snowshoe walk included'],
      },
      {
        name: 'Private',
        price: '₹54,999',
        old: '',
        tag: 'SMALL GROUPS',
        desc: 'Your own instructor & jeep',
        feats: ['Everything in Deluxe', '1:2 private instructor', 'Private 4x4 transfers', 'Flexible daily plan', 'Twin-sharing or solo room'],
      },
    ],
    batches: [
      { date: 'Jan 10 – 15, 2027', seats: 4, price: '₹28,999', status: 'filling' },
      { date: 'Jan 24 – 29, 2027', seats: 9, price: '₹28,999', status: 'open' },
      { date: 'Feb 7 – 12, 2027', seats: 0, price: '₹30,999', status: 'sold' },
      { date: 'Feb 21 – 26, 2027', seats: 11, price: '₹30,999', status: 'open' },
      { date: 'Mar 7 – 12, 2027', seats: 12, price: '₹27,999', status: 'open' },
    ],
    inclusions: [
      '5 nights heated accommodation in Gulmarg',
      '4-day certified ski school with full gear',
      'Breakfast & dinner daily (veg/non-veg)',
      'Gondola tickets as per plan',
      'Srinagar airport transfers',
      'Trip lead + 24x7 on-ground support',
      'Completion certificate',
    ],
    exclusions: [
      'Flights to Srinagar',
      'Lunches & beverages',
      'Phase 2 gondola (Standard plan)',
      'Personal snow-wear purchase',
      'Travel insurance',
      'Anything not listed in inclusions',
    ],
    gallery: ['gal-ski1', 'gal-ski2', 'gal-ski3', 'gal-ski4', 'gal-ski5', 'gal-ski6', 'gal-ski7', 'gal-ski8'],
    testimonials: [
      { seed: 't-ski1', name: 'Tanvi R.', location: 'Mumbai', quote: 'Went in unable to stand on skis, came back carving turns. The instructors are saints with infinite patience.' },
      { seed: 't-ski2', name: 'Aditya & Friends', location: 'Delhi', quote: 'Bonfire wazwan night alone was worth the price. The batch becomes a family by day three.' },
      { seed: 't-ski3', name: 'Neeraj K.', location: 'Bengaluru', quote: 'Everything they promised was there — gear, passes, photographer. Zero surprise costs.' },
    ],
    faqs: [
      { question: 'I\'ve never skied. Is this really for me?', answer: 'Yes — 80% of every batch are first-timers. Day 1 starts with how to wear boots. By day 4 you\'ll be doing controlled runs.' },
      { question: 'What fitness level do I need?', answer: 'If you can climb 3 flights of stairs, you\'re fine. Skiing here is technique-led, not endurance-led.' },
      { question: 'What about clothes?', answer: 'Ski jacket, pants, gloves, helmet and goggles are included. Bring thermals and woollen socks.' },
      { question: 'Is January too cold?', answer: 'It\'s -5 to -12°C — but that\'s the best snow. Hotels are heated and the gear keeps you warm on the slopes.' },
      { question: 'Cancellation policy?', answer: 'Free cancellation 15+ days out. Within 7–15 days your 20% advance converts to a 12-month credit.' },
    ],
    final: {
      title: 'The powder doesn\'t wait. Neither do these batches.',
      sub: 'Lock your seat with ₹5,800 today — pay the rest a week before departure.',
      cta: 'Reserve My Seat',
      note: 'Average batch sells out 6 weeks in advance.',
    },
  };

  return (
    <div className="bg-navy-brand font-sans text-cream antialiased">
      <CampaignUrgencyBar
        offerText={campaign.offer.text}
        deadline={campaign.offer.deadline}
        seats={campaign.offer.seats}
      />
      <CampaignNav ctaText="Reserve a Seat" />
      <CampaignHero
        badge={campaign.badge}
        titleHTML={campaign.titleHTML}
        sub={campaign.sub}
        facts={campaign.facts}
        heroCta={campaign.heroCta}
        proofCount={campaign.proofCount}
        filmDur={campaign.film.dur}
        heroSeed={campaign.heroSeed}
        particles={campaign.particles}
        onFilmClick={() => setFilmOpen(true)}
      />
      <CampaignMarquee items={campaign.strip} />
      <CampaignStats stats={campaign.stats} />
      <CampaignHighlights title={campaign.hlTitle} highlights={campaign.highlights} />
      <CampaignFilm
        posterSeed={campaign.film.posterSeed}
        title={campaign.film.title}
        dur={campaign.film.dur}
        onFilmClick={() => setFilmOpen(true)}
      />
      <CampaignActivities activities={campaign.activities} />
      <CampaignItinerary title={campaign.itnTitle} itinerary={campaign.itinerary} />
      <CampaignPricing tiers={campaign.tiers} />
      <CampaignDepartures batches={campaign.batches} />
      <CampaignInclusions inclusions={campaign.inclusions} exclusions={campaign.exclusions} />
      <CampaignGallery images={campaign.gallery} />
      <CampaignTestimonials testimonials={campaign.testimonials} />
      <CampaignFAQ faqs={campaign.faqs} />
      <CampaignFinalCTA
        title={campaign.final.title}
        sub={campaign.final.sub}
        cta={campaign.final.cta}
        note={campaign.final.note}
        finalSeed={campaign.finalSeed}
      />
      <CampaignStickyMobileCTA price={campaign.tiers[0].price} cta={campaign.form.cta} />
      <CampaignWhatsAppFloat />
      
      <CampaignFilmModal
        isOpen={filmOpen}
        onClose={() => setFilmOpen(false)}
        src={campaign.film.src}
        poster={`https://picsum.photos/seed/${campaign.film.posterSeed}/1400/790`}
      />
    </div>
  );
}