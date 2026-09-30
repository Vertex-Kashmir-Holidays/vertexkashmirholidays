"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { BedDouble, Car, CheckCircle2, Hotel, MessageSquare, Utensils } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/brand";
import { useWhatsAppLink } from "@/components/providers/SiteSettingsProvider";
import { LeadForm } from "@/components/leads/LeadForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/organisms/dialog";
import { trackTourInquiry, trackWhatsappClick } from "@/lib/analytics";
import { fadeUpLg, viewportOnce } from "@/lib/motion";
import type { TourPackageOption } from "@/types/tours";

interface TourPackageCardsProps {
  tourId: string;
  tourName: string;
  /** Published options only, in admin-defined order. */
  options: TourPackageOption[];
}

// "Choose Your Package" section on a tour detail page — one card per
// Tour.packageOptions entry. Every option shares the tour's itinerary (shown
// above this section); cards differ only in stay/services and the public
// 2-person price. Enquire opens the shared LeadForm with the package in
// context (→ Lead.packageName); WhatsApp pre-fills tour + package and never
// creates a Lead by itself.

// Reads ?package=<id> (set by listing cards on /tours and Tour Collection
// pages) and reports it up. A query param rather than a #hash: useSearchParams
// updates on every client navigation — including browser Back/Forward into a
// restored page — whereas hash changes via pushState fire no event and this
// page's forced scroll-to-top swallows the native anchor jump. Isolated in
// its own <Suspense> so the package cards themselves still render in the
// static HTML.
function SelectedPackageFromUrl({
  ids,
  onChange,
}: {
  ids: string[];
  onChange: (id: string | null) => void;
}) {
  const requested = useSearchParams().get("package");
  const selected = requested && ids.includes(requested) ? requested : null;

  useEffect(() => {
    onChange(selected);
    if (!selected) return;
    // Scroll after the page's own ScrollToTopOnMount has run.
    const timer = setTimeout(() => {
      document
        .getElementById(`package-${selected}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
    return () => clearTimeout(timer);
  }, [selected, onChange]);

  return null;
}

export function TourPackageCards({ tourId, tourName, options }: TourPackageCardsProps) {
  const wa = useWhatsAppLink();
  const [enquiring, setEnquiring] = useState<TourPackageOption | null>(null);
  // Package chosen from a listing card (/tours or a Tour Collection page),
  // which links here as /tours/[slug]?package=<id>.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (options.length === 0) return null;

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-3 shadow-soft sm:p-6">
      <Suspense fallback={null}>
        <SelectedPackageFromUrl ids={options.map((o) => o.id)} onChange={setSelectedId} />
      </Suspense>
      <h2 className="text-[18px] font-bold">Choose Your Package</h2>
      <p className="mt-1 text-[14px] text-muted-foreground">
        Same itinerary, your choice of stay and services. Prices shown are for 2 persons — for other
        group sizes, our team will share a quote on request.
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {options.map((o, i) => (
          <motion.article
            key={o.id}
            id={`package-${o.id}`}
            variants={fadeUpLg}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            transition={{ duration: 0.45, delay: i * 0.05 }}
            className={`relative flex scroll-mt-28 flex-col overflow-hidden rounded-2xl border bg-background shadow-soft transition-shadow duration-500 ${
              selectedId === o.id
                ? "border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.25)]"
                : "border-border"
            }`}
          >
            {selectedId === o.id && (
              <span className="absolute right-3 top-3 z-10 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground shadow-soft">
                Selected
              </span>
            )}
            {o.image && (
              <div className="relative h-40">
                <Image
                  src={o.image}
                  alt={`${tourName} — ${o.name} package`}
                  fill
                  sizes="(max-width: 640px) 100vw, 400px"
                  className="object-cover"
                />
              </div>
            )}

            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-[18px] font-extrabold text-foreground">{o.name}</h3>

              <ul className="mt-3 space-y-2 text-[14px]">
                <li className="flex items-start gap-2.5">
                  <Hotel className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
                  <span>
                    <span className="font-semibold">Hotel:</span> {o.hotel}
                  </span>
                </li>
                {o.stay && (
                  <li className="flex items-start gap-2.5">
                    <BedDouble className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
                    <span>
                      <span className="font-semibold">Stay:</span> {o.stay}
                    </span>
                  </li>
                )}
                <li className="flex items-start gap-2.5">
                  <Car className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
                  <span>
                    <span className="font-semibold">Transport:</span> {o.transport}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Utensils className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} />
                  <span>
                    <span className="font-semibold">Meals:</span> {o.meals}
                  </span>
                </li>
              </ul>

              {o.inclusions.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-border pt-3 text-[14px] text-muted-foreground">
                  {o.inclusions.map((inc) => (
                    <li key={inc} className="flex items-start gap-2">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        strokeWidth={2}
                      />
                      {inc}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto pt-4">
                <p className="flex items-baseline gap-1.5 border-t border-border pt-3">
                  <span className="text-[24px] font-extrabold leading-none text-foreground">
                    ₹{o.priceForTwo.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[14px] font-medium text-muted-foreground">/ 2 persons</span>
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a
                    href={wa(
                      `Hi! I'm interested in the "${tourName}" — ${o.name} package. Please share details and availability.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackWhatsappClick("tour_package_card", undefined, {
                        tourName,
                        packageOption: o.name,
                      })
                    }
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 py-2.5 text-[14px] font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5" />
                    WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setEnquiring(o);
                      trackTourInquiry(tourName, tourId, o.name);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-[14px] font-semibold text-primary-foreground transition hover:brightness-110"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Enquire
                  </button>
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <Dialog open={enquiring !== null} onOpenChange={(open) => !open && setEnquiring(null)}>
        <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[18px]">Enquire — {enquiring?.name} package</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {tourName}. Share your details and our team will confirm availability and the price for
            your group.
          </DialogDescription>
          {enquiring && (
            <LeadForm
              key={enquiring.id}
              source="tour-detail"
              context={{ tourId, tourName, packageName: enquiring.name }}
              buttonLabel="Send Enquiry"
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
