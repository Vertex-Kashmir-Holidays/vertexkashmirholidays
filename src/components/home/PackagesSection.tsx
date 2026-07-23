"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TourCard } from "@/components/ui/organisms/TourCard";
import { formatINR, renderAccents } from "@/lib/accents";
import { fadeUp, fadeUpLg, fadeIn, fadeRight, viewportOnce } from "@/lib/motion";
import type { HomeTourData, SectionHeading } from "@/types/home";

interface PackagesSectionProps {
  heading: SectionHeading;
  tours: HomeTourData[];
}

const badgeColors = ["orange", "blue", "green"] as const;

export function PackagesSection({ heading, tours }: PackagesSectionProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  if (tours.length === 0) return null;

  return (
    <section
      id="packages"
      className="relative z-[2] mx-auto max-w-[1300px] px-4 pt-16 sm:px-6 sm:pt-24"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <motion.p
            className="rv text-[12px] font-bold tracking-[0.22em] text-primary"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            transition={{ duration: 0.5 }}
          >
            {heading.kicker}
          </motion.p>
          <motion.h2
            className="rv h-display mt-3 text-[18px] font-bold text-foreground"
            style={{ "--rd": "0.08s" } as React.CSSProperties}
            variants={fadeUpLg}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {renderAccents(heading.title)}
          </motion.h2>
          {heading.subtitle && (
            <motion.p
              className="rv mt-3 max-w-md text-sm text-muted-foreground"
              style={{ "--rd": "0.14s" } as React.CSSProperties}
              variants={fadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {heading.subtitle}
            </motion.p>
          )}
        </div>
        {heading.ctaLabel && (
          <motion.div
            variants={fadeRight}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              href={heading.ctaHref ?? "#"}
              className="rv inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
            >
              {heading.ctaLabel}
            </Link>
          </motion.div>
        )}
      </div>

      <motion.div
        className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {tours.map((tour, i) => (
          <TourCard
            key={tour.id}
            tour={{
              badge: tour.badge ?? "FEATURED",
              bc: (badgeColors as readonly string[]).includes(tour.badgeColor ?? "")
                ? (tour.badgeColor as "orange" | "blue" | "green")
                : "green",
              image: tour.image ?? undefined,
              detailHref: `/tours/${tour.slug}`,
              bookHref: `/booking?tour=${tour.slug}`,
              t: tour.title,
              d: tour.durationLabel,
              places: tour.places,
              r: tour.rating.toFixed(1),
              n: String(tour.reviewCount),
              old: tour.priceWas ? formatINR(tour.priceWas) : undefined,
              p: formatINR(tour.priceFrom),
            }}
            index={i}
            variant="home"
          />
        ))}
      </motion.div>
    </section>
  );
}
