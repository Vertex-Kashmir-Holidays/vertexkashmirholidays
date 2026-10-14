"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Tag } from "lucide-react";
import { Tilt3D } from "@/components/ui/effects/3DTilt";
import { imgSrc } from "@/lib/placeholder";
import { formatINR } from "@/lib/accents";
import type { AdventureListItemData } from "@/types/adventure";

interface AdventureCardProps {
  adventure: AdventureListItemData;
  index?: number;
}

export function AdventureCard({ adventure, index = 0 }: AdventureCardProps) {
  const href = `/adventures/${adventure.slug}`;

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
            <Link href={href} aria-label={adventure.name} className="relative block h-full w-full">
              <Image
                src={imgSrc(adventure.image)}
                alt={adventure.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </Link>
            {adventure.badge && (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[12px] font-extrabold uppercase tracking-wide text-primary-foreground shadow-lg">
                <Sparkles className="h-3 w-3" strokeWidth={2.4} />
                {adventure.badge}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-5">
            <h3 className="text-[18px] font-bold leading-snug">
              <Link href={href} className="transition-colors hover:text-primary">
                {adventure.name}
              </Link>
            </h3>

            {adventure.sub && (
              <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-muted-foreground">
                {adventure.sub}
              </p>
            )}

            {/* Facts / highlights chips */}
            {adventure.facts.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {adventure.facts.slice(0, 3).map((fact, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-border bg-muted px-2.5 py-1 text-[12px] font-medium text-muted-foreground"
                  >
                    {fact}
                  </span>
                ))}
              </div>
            )}

            {/* Offer strip */}
            {adventure.offerText && (
              <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-[12px] font-semibold text-primary">
                <Tag className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
                <span className="line-clamp-1">{adventure.offerText}</span>
              </p>
            )}

            <div className="mt-auto" />

            {/* Price */}
            {adventure.priceFrom != null && (
              <div className="mt-4 flex items-end gap-2 border-t border-border pt-4">
                <span className="text-[12px] text-muted-foreground">From</span>
                {adventure.priceWas != null && adventure.priceWas > adventure.priceFrom && (
                  <span className="text-[14px] text-muted-foreground line-through">
                    {formatINR(adventure.priceWas)}
                  </span>
                )}
                <p className="text-[22px] font-extrabold leading-none text-foreground">
                  {formatINR(adventure.priceFrom)}
                </p>
                <span className="pb-0.5 text-[12px] text-muted-foreground">/ person</span>
              </div>
            )}

            {/* CTA */}
            <motion.div className="mt-4" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={href}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-[14px] font-semibold text-primary-foreground transition-all duration-300 hover:brightness-110 hover:shadow-md"
              >
                Explore Adventure
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
              </Link>
            </motion.div>
          </div>
        </article>
      </Tilt3D>
    </motion.div>
  );
}
