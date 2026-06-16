// src/components/about/AboutTeam.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { renderMint } from '@/lib/accents';
import type { AboutTeamHeading, TeamMemberData } from '@/types/about';

interface AboutTeamProps {
  heading: AboutTeamHeading;
  team: TeamMemberData[];
}

export function AboutTeam({ heading, team }: AboutTeamProps) {
  if (team.length === 0) return null;

  return (
    <section id="team" className="mx-auto max-w-[1300px] px-6 py-14">
      <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
        <div>
          <p className="text-[11.5px] font-bold tracking-[0.22em] text-primary">{heading.kicker}</p>
          <h2 className="h-display mt-3 font-display text-[30px] font-bold leading-snug">{renderMint(heading.title)}</h2>
        </div>
        <div className="scrollbar-none grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {team.map((m, i) => (
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
                  src={m.image}
                  alt={m.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover"
                />
              </div>
              <div className="p-3.5">
                <p className="text-[13.5px] font-bold leading-snug">{m.name}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-primary">{m.role}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{m.bio}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
      {heading.ctaLabel && (
        <div className="mt-9 flex justify-center">
          <a href={heading.ctaHref ?? '#'} className="rounded-lg border-[1.5px] border-border bg-card px-6 py-2.5 text-[13px] font-semibold shadow-soft transition hover:border-primary hover:text-primary">
            {heading.ctaLabel}
          </a>
        </div>
      )}
    </section>
  );
}
