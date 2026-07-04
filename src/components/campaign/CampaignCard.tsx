'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Tag } from 'lucide-react';
import { Tilt3D } from '@/components/ui/3DTilt';
import { imgSrc } from '@/lib/placeholder';
import { formatINR } from '@/lib/accents';
import type { CampaignListItemData } from '@/types/campaign';

interface CampaignCardProps {
  campaign: CampaignListItemData;
  index?: number;
}

export function CampaignCard({ campaign, index = 0 }: CampaignCardProps) {
  const href = `/adventures/${campaign.slug}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <Tilt3D intensity={6}>
        <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-primary/10">
          {/* Image */}
          <div className="relative h-48 overflow-hidden">
            <Link href={href} aria-label={campaign.name} className="relative block h-full w-full">
              <Image
                src={imgSrc(campaign.image)}
                alt={campaign.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </Link>
            {campaign.badge && (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-primary-foreground shadow-lg">
                <Sparkles className="h-3 w-3" strokeWidth={2.4} />
                {campaign.badge}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-5">
            <h3 className="text-[17px] font-bold leading-snug">
              <Link href={href} className="transition-colors hover:text-primary">
                {campaign.name}
              </Link>
            </h3>

            {campaign.sub && (
              <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
                {campaign.sub}
              </p>
            )}

            {/* Facts / highlights chips */}
            {campaign.facts.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {campaign.facts.slice(0, 3).map((fact, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-border bg-muted px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground"
                  >
                    {fact}
                  </span>
                ))}
              </div>
            )}

            {/* Offer strip */}
            {campaign.offerText && (
              <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-[11px] font-semibold text-primary">
                <Tag className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
                <span className="line-clamp-1">{campaign.offerText}</span>
              </p>
            )}

            <div className="mt-auto" />

            {/* Price */}
            {campaign.priceFrom != null && (
              <div className="mt-4 flex items-end gap-2 border-t border-border pt-4">
                <span className="text-[11px] text-muted-foreground">From</span>
                {campaign.priceWas != null && campaign.priceWas > campaign.priceFrom && (
                  <span className="text-[12px] text-muted-foreground line-through">
                    {formatINR(campaign.priceWas)}
                  </span>
                )}
                <p className="text-[22px] font-extrabold leading-none text-foreground">
                  {formatINR(campaign.priceFrom)}
                </p>
                <span className="pb-0.5 text-[10px] text-muted-foreground">/ person</span>
              </div>
            )}

            {/* CTA */}
            <motion.div className="mt-4" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={href}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-[12.5px] font-semibold text-primary-foreground transition-all duration-300 hover:brightness-110 hover:shadow-md"
              >
                Explore Campaign
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
              </Link>
            </motion.div>
          </div>
        </article>
      </Tilt3D>
    </motion.div>
  );
}
