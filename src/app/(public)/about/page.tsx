// src/app/(public)/about/page.tsx

import type { Metadata } from 'next';
import Link from 'next/link';
import { cache } from 'react';
import { ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/siteSettings';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import { AboutCTA } from '@/components/about/AboutCTA';
import { AboutCertifications } from '@/components/about/AboutCertifications';
import { AboutHero } from '@/components/about/AboutHero';
import { AboutJourney } from '@/components/about/AboutJourney';
import { AboutPress } from '@/components/about/AboutPress';
import { AboutReviews } from '@/components/about/AboutReviews';
import { AboutStats } from '@/components/about/AboutStats';
import { AboutStory } from '@/components/about/AboutStory';
import { AboutTeam } from '@/components/about/AboutTeam';
import { AboutValues } from '@/components/about/AboutValues';
import { FaqPreviewList } from '@/components/faqs/FaqPreviewList';
import { sanitizePressHtml } from '@/lib/sanitize';
import { formatBusinessAddress } from '@/lib/businessAddress';
import { getApprovedReviewsPage, getReviewStats } from '@/lib/reviews';
import { getGooglePlaceRating } from '@/lib/reviews/googlePlaces';
import { parseTripadvisorWidget } from '@/lib/reviews/tripadvisorWidget';
import { getFaqsForPlacement } from '@/lib/faqs';
import { JsonLd, buildBreadcrumbList, buildFAQPage, buildOrganizationPeople } from '@/components/seo/JsonLd';

export const revalidate = 1800;

// Wrapped in React's cache() so generateMetadata() and the page component
// share one query per request instead of each fetching this row separately.
const getAboutContent = cache(async () =>
  prisma.aboutContent.findUnique({ where: { id: 'singleton' } }),
);

export async function generateMetadata(): Promise<Metadata> {
  const content = await getAboutContent();
  return buildMetadata({
    title: 'About Us — Local Kashmir Travel Experts',
    description:
      'Meet Vertex Kashmir Holidays — a Kashmir-based team crafting honest, handpicked tours with zero middlemen, transparent pricing and 24/7 on-ground support.',
    canonical: `${SITE_URL}/about`,
    ogImage: content?.ogImage ?? content?.heroImage ?? null,
  });
}

export default async function AboutPage() {
  const [content, storyFeatures, stats, values, certifications, team, journey, press, settings, { items: reviews }, reviewStats, aboutFaqs] =
    await Promise.all([
      getAboutContent(),
      prisma.aboutStoryFeature.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.aboutStat.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.aboutValue.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.certification.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.teamMember.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.journeyMilestone.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.pressLogo.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      getSiteSettings(),
      // Compact reuse of the same review infrastructure /reviews and /contact
      // already use — no new collection system, just a smaller slice of it.
      getApprovedReviewsPage({ page: 1, perPage: 3 }),
      getReviewStats(),
      // Centralized FAQ module — same Faq pool /contact and /faq draw from,
      // filtered to whichever entries an admin placed on ABOUT.
      getFaqsForPlacement('ABOUT'),
    ]);
  const businessAddress = formatBusinessAddress(settings) ?? settings?.siteAddress ?? null;
  const googleRating = await getGooglePlaceRating(settings?.googlePlaceId);
  const tripadvisorRatingWidget = parseTripadvisorWidget(settings?.tripadvisorRatingWidgetEmbed);

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: 'Home', url: SITE_URL },
    { name: 'About Us', url: `${SITE_URL}/about` },
  ]);
  // Augments the sitewide Organization node — detected from the team's own
  // role text (contains "Founder"), never asserted separately, so it can't
  // drift from what the page itself shows.
  const founder = team.find((m) => /founder/i.test(m.role));
  const organizationPeopleJsonLd = buildOrganizationPeople({
    founder: founder ? { name: founder.name, jobTitle: founder.role } : null,
    employees: team.filter((m) => m.id !== founder?.id).map((m) => ({ name: m.name, jobTitle: m.role })),
  });
  // Short answers only — matches what FaqPreviewList actually renders below.
  const faqJsonLd =
    aboutFaqs.length > 0 ? buildFAQPage(aboutFaqs.map((f) => ({ question: f.question, answer: f.shortAnswer }))) : null;

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />
      {team.length > 0 && <JsonLd data={organizationPeopleJsonLd} />}
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <AboutHero
        data={{
          breadcrumb: content?.heroBreadcrumb ?? null,
          title: content?.heroTitle ?? null,
          subtitle: content?.heroSubtitle ?? null,
          image: content?.heroImage ?? null,
          imageMobile: content?.heroImageMobile ?? null,
          ctaPrimaryLabel: content?.heroCtaPrimaryLabel ?? null,
          ctaPrimaryHref: content?.heroCtaPrimaryHref ?? null,
          ctaSecondaryLabel: content?.heroCtaSecondaryLabel ?? null,
          ctaSecondaryHref: content?.heroCtaSecondaryHref ?? null,
        }}
      />
      <AboutStory
        data={{
          kicker: content?.storyKicker ?? null,
          title: content?.storyTitle ?? null,
          body: content?.storyBody ?? null,
          image: content?.storyImage ?? null,
        }}
        features={storyFeatures.map((f) => ({
          id: f.id,
          title: f.title,
          subtitle: f.subtitle,
          icon: f.icon,
        }))}
      />
      <AboutStats
        image={content?.statsImage ?? null}
        stats={stats.map((s) => ({
          id: s.id,
          value: s.value,
          label: s.label,
          icon: s.icon,
        }))}
      />
      <AboutValues
        heading={{
          kicker: content?.valuesKicker ?? null,
          title: content?.valuesTitle ?? null,
          subtitle: content?.valuesSubtitle ?? null,
        }}
        values={values.map((v) => ({
          id: v.id,
          title: v.title,
          subtitle: v.subtitle,
          icon: v.icon,
        }))}
      />
      <AboutCertifications
        licenses={{
          businessName: settings?.legalName ?? settings?.siteName ?? null,
          registrationNumber: settings?.tourismRegNumber ?? null,
          authority: settings?.tourismRegAuthority ?? null,
        }}
        certifications={certifications.map((c) => ({
          id: c.id,
          title: c.title,
          subtitle: c.subtitle,
          icon: c.icon,
        }))}
      />
      <AboutTeam
        heading={{
          kicker: content?.teamKicker ?? null,
          title: content?.teamTitle ?? null,
          ctaLabel: content?.teamCtaLabel ?? null,
          ctaHref: content?.teamCtaHref ?? null,
        }}
        team={team.map((m) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          bio: m.bio,
          image: m.image,
        }))}
      />
      <AboutJourney
        heading={{
          kicker: content?.journeyKicker ?? null,
          title: content?.journeyTitle ?? null,
          subtitle: null,
        }}
        journey={journey.map((j) => ({
          id: j.id,
          year: j.year,
          detail: j.detail,
          icon: j.icon,
        }))}
      />
      <AboutPress label={content?.pressLabel ?? null} items={press.map((p) => sanitizePressHtml(p.html))} />
      {aboutFaqs.length > 0 && (
        <section className="mx-auto max-w-[1300px] px-6 py-14">
          <p className="text-[12px] font-bold tracking-[0.22em] text-primary">{content?.faqsKicker ?? 'QUESTIONS'}</p>
          <h2 className="h-display mt-3 font-display text-[18px] font-bold leading-snug">{content?.faqsTitle ?? 'Frequently Asked'}</h2>
          <div className="mt-6">
            <FaqPreviewList faqs={aboutFaqs} columns={2} />
          </div>
          <Link href="/faq" className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-bold text-primary hover:underline">
            View all FAQs
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
          </Link>
        </section>
      )}
      <AboutReviews
        googleRating={googleRating}
        googleProfileUrl={settings?.googleReviews ?? null}
        tripadvisorWidget={tripadvisorRatingWidget}
        tripadvisorProfileUrl={settings?.tripadvisor ?? null}
        siteStats={reviewStats}
        reviews={reviews}
      />
      <AboutCTA
        data={{
          title: content?.ctaTitle ?? null,
          subtitle: content?.ctaSubtitle ?? null,
          image: content?.ctaImage ?? null,
          whatsappLabel: content?.ctaWhatsappLabel ?? null,
          whatsappHref: content?.ctaWhatsappHref ?? null,
          callLabel: content?.ctaCallLabel ?? null,
          callHref: content?.ctaCallHref ?? null,
          emailLabel: content?.ctaEmailLabel ?? null,
          emailHref: content?.ctaEmailHref ?? null,
        }}
      />
      {(settings?.legalName || settings?.tourismRegNumber || businessAddress) && (
        <p className="mx-auto max-w-[1300px] px-6 pb-10 text-center text-[12px] leading-relaxed text-muted-foreground">
          {settings?.legalName && settings.legalName !== settings?.siteName
            ? `"${settings?.siteName ?? 'Vertex Kashmir Holidays'}" is operated by ${settings.legalName}`
            : settings?.siteName ?? 'Vertex Kashmir Holidays'}
          {settings?.tourismRegNumber && ` · J&K Tourism Reg. No. ${settings.tourismRegNumber}`}
          {businessAddress && ` · ${businessAddress}`}
        </p>
      )}
    </div>
  );
}
