"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Tilt3D } from "@/components/ui/effects/3DTilt";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/brand";
import { imgSrc } from "@/lib/placeholder";
import { formatINR } from "@/lib/accents";
import { useSiteSettings, useWhatsAppLink } from "@/components/providers/SiteSettingsProvider";

export interface ActivityCardData {
  id: string;
  slug: string;
  name: string;
  location: string | null;
  duration: string | null;
  price: number | null;
  image: string | null;
}

// Mirrors the Tours TourCard shell (image, badge, title, meta, price, dual CTA)
// adapted to activity content — so the two listings feel like one product.
export function ActivityCard({
  activity,
  index = 0,
}: {
  activity: ActivityCardData;
  index?: number;
}) {
  const detailHref = `/activities/${activity.slug}`;
  const { siteName } = useSiteSettings();
  const wa = useWhatsAppLink();
  const whatsappHref = wa(
    `Hi ${siteName}! I'm interested in the "${activity.name}" activity in Kashmir. Could you share details and availability?`,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <Tilt3D intensity={6}>
        <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-primary/10">
          {/* Image */}
          <div className="relative h-44 overflow-hidden">
            <Link
              href={detailHref}
              aria-label={activity.name}
              className="relative block h-full w-full"
            >
              <Image
                src={imgSrc(activity.image)}
                alt={activity.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </Link>
            <span className="absolute left-3 top-3 rounded-md bg-badge-green px-2.5 py-1 text-[12px] font-extrabold tracking-wide text-white shadow-lg">
              ACTIVITY
            </span>
            {activity.duration && (
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-brand-dark/80 px-2.5 py-1 text-[12px] font-bold text-white backdrop-blur">
                <Clock className="h-3 w-3" /> {activity.duration}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-5">
            <h3 className="text-[16px] font-bold leading-snug text-foreground">
              <Link href={detailHref} className="transition-colors hover:text-primary">
                {activity.name}
              </Link>
            </h3>

            {activity.location && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[14px] text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
                {activity.location}
              </p>
            )}

            {/* Price */}
            <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
              <span className="text-[12px] text-muted-foreground">From</span>
              <p className="text-[22px] font-extrabold leading-tight text-foreground">
                {activity.price != null ? formatINR(activity.price) : "On request"}
              </p>
              <span className="text-[10px] text-muted-foreground">per person</span>
            </div>

            {/* CTAs */}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border py-2">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 py-2.5 text-[14px] font-semibold text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:shadow-md"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  WhatsApp
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={detailHref}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-[14px] font-semibold text-primary-foreground transition-all duration-300 hover:brightness-110 hover:shadow-md"
                >
                  View Details
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
                </Link>
              </motion.div>
            </div>
          </div>
        </article>
      </Tilt3D>
    </motion.div>
  );
}
