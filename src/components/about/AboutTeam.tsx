// src/components/about/AboutTeam.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { imgSrc } from '@/lib/placeholder';
import { renderMint } from '@/lib/accents';
import type { AboutTeamHeading, TeamMemberData } from '@/types/about';

interface AboutTeamProps {
  heading: AboutTeamHeading;
  team: TeamMemberData[];
}

// Default crop focus for a member photo with no per-member override — 25%
// from the top keeps typical portrait headshots in frame instead of the
// center-crop default, which was cutting heads off on this card's short,
// wide (not square) image area.
const DEFAULT_IMAGE_FOCUS = "50% 25%";

export function AboutTeam({ heading, team }: AboutTeamProps) {
  if (team.length === 0) return null;

  // 6 cards, 3 per row (2 rows) — the "Meet Our Full Team" link below used to
  // lead to more, but it pointed nowhere (href was always "#"), so instead of
  // linking out we just cap the grid at a clean 3x2.
  const visible = team.slice(0, 6);

  return (
    <section id="team" className="mx-auto max-w-[1300px] px-6 py-14">
      <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
        <div>
          <p className="text-[12px] font-bold tracking-[0.22em] text-primary">{heading.kicker}</p>
          <h2 className="h-display mt-3 font-display text-[18px] font-bold leading-snug">{renderMint(heading.title)}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {visible.map((m, i) => (
            <motion.article
              key={m.id}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="relative h-[120px] w-full overflow-hidden">
                <Image
                  src={imgSrc(m.image)}
                  alt={m.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover"
                  // Face-focused crop only applies to a real uploaded photo —
                  // the branded placeholder (no photo set) keeps the default
                  // centered position so its logo mark isn't shifted.
                  style={m.image?.trim() ? { objectPosition: m.imageFocus?.trim() || DEFAULT_IMAGE_FOCUS } : undefined}
                />
              </div>
              <div className="p-3.5">
                <p className="text-[14px] font-bold leading-snug">{m.name}</p>
                <p className="mt-0.5 text-[12px] font-semibold text-primary">{m.role}</p>
                <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{m.bio}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
