"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { fadeUpLg, viewportOnce } from "@/lib/motion";
import { Tilt3D } from "../effects/3DTilt";
import { Car, Hotel, Utensils, Sailboat, Calendar } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/brand";
import { imgSrc } from "@/lib/placeholder";
import { hotelClassLabel } from "@/lib/tours/categories";
import { trackWhatsappClick } from "@/lib/analytics";
import { useSiteSettings, useWhatsAppLink } from "@/components/providers/SiteSettingsProvider";

interface TourCardProps {
  tour: {
    badge: string;
    bc: "orange" | "blue" | "green";
    seed?: string;
    image?: string;
    detailHref?: string;
    bookHref?: string;
    whatsappHref?: string;
    /** TourCategory — drives the hotel label when `inclusions.hotel` isn't set. */
    category?: string;
    t: string;
    d: string;
    places: string;
    r: string;
    n: string;
    old?: string;
    p: string;
    minPersons?: number;
    // Replaces the default "per person (min N pax)" label — e.g. "/ 2 persons"
    // for tours sold as package options (see Tour.packageOptions).
    priceSuffix?: string;
    inclusions?: {
      transfers?: boolean;
      hotel?: string;
      meals?: boolean;
      shikara?: boolean;
    };
  };
  index?: number;
  variant?: "home" | "tours";
}

const badgeCls = {
  orange: "bg-badge-orange",
  blue: "bg-badge-blue",
  green: "bg-badge-green",
};

export function TourCard({ tour, index = 0, variant = "tours" }: TourCardProps) {
  const isHome = variant === "home";

  // Default inclusions if not provided
  const inclusions = tour.inclusions || {
    transfers: true,
    meals: true,
    shikara: true,
  };
  const hotelLabel = inclusions.hotel || hotelClassLabel(tour.category);

  // Clicking the card (image, title or primary CTA) opens the tour detail page.
  const detailHref = tour.detailHref || tour.bookHref || "#";

  // WhatsApp CTA → site number with a package-specific prefilled message.
  // A real provided href wins; placeholder "#" / empty falls back to the site number.
  const { siteName } = useSiteSettings();
  const wa = useWhatsAppLink();
  const explicitWa = tour.whatsappHref && tour.whatsappHref !== "#" ? tour.whatsappHref : null;
  const whatsappHref =
    explicitWa ||
    wa(
      `Hi ${siteName}! I'm interested in the "${tour.t}" package. Could you share details and availability?`,
    );

  return (
    <motion.div
      variants={fadeUpLg}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <Tilt3D intensity={isHome ? 8 : 6}>
        <article
          className={`sweep-hover group flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
            isHome
              ? "bg-gradient-to-br from-foreground/[0.05] to-transparent backdrop-blur-sm border border-border rounded-3xl shadow-card hover:shadow-green-glow/20"
              : "border border-border bg-card shadow-soft hover:shadow-primary/10"
          }`}
        >
          {/* Image Section */}
          <div className="relative h-44 overflow-hidden">
            <Link href={detailHref} aria-label={tour.t} className="relative block h-full w-full">
              <Image
                src={imgSrc(tour.image)}
                alt={tour.t}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </Link>
            <motion.span
              className={`absolute left-3 top-3 rounded-md ${badgeCls[tour.bc]} px-2.5 py-1 text-[12px] font-extrabold tracking-wide text-white shadow-lg`}
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ delay: index * 0.05 + 0.3 }}
            >
              {tour.badge}
            </motion.span>
          </div>

          {/* Content Section */}
          <div className="flex flex-1 flex-col p-5">
            {/* Title */}
            <h3
              className={`text-[16px] font-bold leading-snug ${isHome ? "text-foreground" : "text-foreground"}`}
            >
              <Link href={detailHref} className="transition-colors hover:text-primary">
                {tour.t}
              </Link>
            </h3>

            {/* Duration & Destinations */}
            <p
              className={`mt-1.5 text-[14px] leading-relaxed ${isHome ? "text-muted-foreground" : "text-muted-foreground"}`}
            >
              <span className="font-semibold">{tour.d}</span>
              <span className="mx-2 opacity-40">·</span>
              {tour.places}
            </p>

            {/* Inclusions Grid */}
            <div
              className={`mt-3 grid ${
                ["grid-cols-2", "grid-cols-3", "grid-cols-4"][
                  (inclusions.meals === false ? 0 : 1) + (inclusions.shikara === false ? 0 : 1)
                ]
              } gap-2 py-2 border-t border-b ${isHome ? "border-border" : "border-border"}`}
            >
              {/* Transfers */}
              <div className="flex flex-col items-center gap-1">
                <Car className="h-5 w-5 text-primary" strokeWidth={1.8} />
                <span
                  className={`text-[10px] font-medium ${isHome ? "text-muted-foreground" : "text-muted-foreground"}`}
                >
                  Transfers
                </span>
              </div>

              {/* Hotel */}
              <div className="flex flex-col items-center gap-1">
                <Hotel className="h-5 w-5 text-primary" strokeWidth={1.8} />
                <span
                  className={`text-[10px] font-medium ${isHome ? "text-muted-foreground" : "text-muted-foreground"}`}
                >
                  {hotelLabel}
                </span>
              </div>

              {/* Meals — hidden with meals: false (e.g. a no-meals package option) */}
              {inclusions.meals !== false && (
                <div className="flex flex-col items-center gap-1">
                  <Utensils className="h-5 w-5 text-primary" strokeWidth={1.8} />
                  <span
                    className={`text-[10px] font-medium ${isHome ? "text-muted-foreground" : "text-muted-foreground"}`}
                  >
                    Meals
                  </span>
                </div>
              )}

              {/* Shikara — Kashmir-specific, so a caller can opt out with shikara: false */}
              {inclusions.shikara !== false && (
                <div className="flex flex-col items-center gap-1">
                  <Sailboat className="h-5 w-5 text-primary" strokeWidth={1.8} />
                  <span
                    className={`text-[10px] font-medium ${isHome ? "text-muted-foreground" : "text-muted-foreground"}`}
                  >
                    Shikara
                  </span>
                </div>
              )}
            </div>

            {/* Price Section */}
            <div className="mt-3 flex items-end justify-between">
              {tour.old ? (
                <span
                  className={`text-[12px] ${isHome ? "text-muted-foreground" : "text-muted-foreground"} line-through`}
                >
                  {tour.old}
                </span>
              ) : (
                <span className="text-[12px]">&nbsp;</span>
              )}
              <p
                className={`text-[22px] font-extrabold leading-tight ${isHome ? "text-primary" : "text-foreground"}`}
              >
                {tour.p}
              </p>
              <p
                className={`text-[10px] ${isHome ? "text-muted-foreground" : "text-muted-foreground"}`}
              >
                {tour.priceSuffix ?? (
                  <>
                    per person
                    {tour.minPersons && tour.minPersons > 1 ? ` (min ${tour.minPersons} pax)` : ""}
                  </>
                )}
              </p>
            </div>

            {/* Customization Text */}
            <p
              className={`mt-3 py-1 text-[12px] italic  border-t  ${isHome ? "text-muted-foreground border-border" : "text-muted-foreground border-border"}`}
            >
              ✦ Tour can be customized as per requirements
            </p>

            {/* CTA Buttons */}
            <div
              className={`mt-3 py-2 grid grid-cols-2 gap-2 border-t ${isHome ? "border-border" : "border-border"}`}
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    trackWhatsappClick("tours_card");
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[14px] font-semibold transition-all duration-300 ${
                    isHome
                      ? "border border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-glow"
                      : "border border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md"
                  }`}
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  WhatsApp
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={detailHref}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[14px] font-semibold transition-all duration-300 ${
                    isHome
                      ? "bg-primary text-primary-foreground hover:brightness-110 hover:shadow-glow"
                      : "bg-primary text-primary-foreground hover:brightness-110 hover:shadow-md"
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" strokeWidth={2.2} />
                  Book Now
                </Link>
              </motion.div>
            </div>
          </div>
        </article>
      </Tilt3D>
    </motion.div>
  );
}
