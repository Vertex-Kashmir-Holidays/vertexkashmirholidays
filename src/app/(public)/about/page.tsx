// src/app/(public)/about/page.tsx

import { AboutCTA } from '@/components/about/AboutCTA';
import { AboutHero } from '@/components/about/AboutHero';
import { AboutJourney } from '@/components/about/AboutJourney';
import { AboutPress } from '@/components/about/AboutPress';
import { AboutStats } from '@/components/about/AboutStats';
import { AboutStory } from '@/components/about/AboutStory';
import { AboutTeam } from '@/components/about/AboutTeam';
import { AboutValues } from '@/components/about/AboutValues';

export default function AboutPage() {
  return (
    <div className="bg-white text-brand-ink">
      <AboutHero />
      <AboutStory />
      <AboutStats />
      <AboutValues />
      <AboutTeam />
      <AboutJourney />
      <AboutPress />
      <AboutCTA />
    </div>
  );
}