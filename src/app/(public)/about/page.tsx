// src/app/(public)/about/page.tsx

import { prisma } from '@/lib/prisma';
import { AboutCTA } from '@/components/about/AboutCTA';
import { AboutHero } from '@/components/about/AboutHero';
import { AboutJourney } from '@/components/about/AboutJourney';
import { AboutPress } from '@/components/about/AboutPress';
import { AboutStats } from '@/components/about/AboutStats';
import { AboutStory } from '@/components/about/AboutStory';
import { AboutTeam } from '@/components/about/AboutTeam';
import { AboutValues } from '@/components/about/AboutValues';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const [content, storyFeatures, stats, values, team, journey, press] =
    await Promise.all([
      prisma.aboutContent.findUnique({ where: { id: 'singleton' } }),
      prisma.aboutStoryFeature.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.aboutStat.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.aboutValue.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.teamMember.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.journeyMilestone.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.pressLogo.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    ]);

  return (
    <div className="bg-background text-foreground">
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
      <AboutPress label={content?.pressLabel ?? null} items={press.map((p) => p.html)} />
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
    </div>
  );
}
