"use client";

import { ArrowRight, BedDouble, CalendarDays, Clock3, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/organisms/dialog";
import { LeadForm } from "@/components/leads/LeadForm";
import { WhatsAppIcon } from "@/components/icons/brand";
import { useSiteSettings, useWhatsAppLink } from "@/components/providers/SiteSettingsProvider";
import { trackWhatsappClick } from "@/lib/analytics";
import { NOT_SURE_PACKAGE } from "@/lib/offers/content";
import { formatINR } from "@/lib/accents";
import { cn } from "@/lib/utils";
import type { OfferPlanView } from "@/lib/offers/view";
import { offerClickParams, offerWhatsAppMessage, useOfferSelection } from "./OfferSelection";

// The offer's enquiry form, in a modal every CTA on the page opens (hero,
// section nav, plan cards, closing band, mobile bar). Left: a live summary of
// the chosen plan (price, night split, dates) so the visitor confirms what
// they're asking for. Right: the site-wide <LeadForm /> (same validation,
// anti-bot, attribution, duplicate handling and lead_submit event) plus a plan
// picker. Dates are fixed by the offer, so they're shown, never asked. The
// chosen plan travels as context.packageName and is checked server-side
// against the offer's published tiers.
export function OfferEnquiryModal({
  plans,
  duration,
}: {
  plans: OfferPlanView[];
  duration: string | null;
}) {
  const { offer, selected, select, enquiryOpen, setEnquiryOpen } = useOfferSelection();
  const { formAvatars } = useSiteSettings();
  const plan = plans.find((p) => p.name === selected) ?? null;
  const choices = [...plans.map((p) => p.name), NOT_SURE_PACKAGE];

  const planPicker =
    plans.length > 0 ? (
      <fieldset>
        <legend className="mb-1.5 block text-[14px] font-semibold text-foreground/90">
          Your package
        </legend>
        <div className="flex flex-wrap gap-2">
          {choices.map((choice) => {
            const value = choice === NOT_SURE_PACKAGE ? null : choice;
            const active = selected === value;
            return (
              <button
                key={choice}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => select(value)}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-[14px] font-semibold transition",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary",
                )}
              >
                {choice}
              </button>
            );
          })}
        </div>
      </fieldset>
    ) : undefined;

  return (
    <Dialog open={enquiryOpen} onOpenChange={setEnquiryOpen}>
      <DialogContent className="max-h-[92svh] w-[calc(100%-1.5rem)] max-w-4xl gap-0 overflow-y-auto p-0 sm:rounded-3xl">
        <div className="grid md:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-brand-dark p-6 text-white sm:p-8">
            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-primary">
              {offer.name}
            </p>
            <DialogTitle className="h-display mt-2 text-[26px] leading-tight text-white sm:text-[30px]">
              {offer.ctaLabel}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Share your details and our team will send the full plan.
            </DialogDescription>
            <ul className="mt-5 space-y-2.5 text-[14px] text-white/85">
              {offer.dates && (
                <li className="flex items-center gap-2.5">
                  <CalendarDays className="h-4 w-4 text-primary" /> {offer.dates}
                </li>
              )}
              {duration && (
                <li className="flex items-center gap-2.5">
                  <Clock3 className="h-4 w-4 text-primary" /> {duration}
                </li>
              )}
              {plan?.splitLabel && (
                <li className="flex items-center gap-2.5">
                  <BedDouble className="h-4 w-4 text-primary" /> {plan.splitLabel}
                </li>
              )}
            </ul>
            <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-4">
              {plan ? (
                <>
                  <p className="text-[13px] text-white/65">
                    {plan.displayName} · total for 2 adults
                  </p>
                  <p className="mt-1 text-[30px] font-bold leading-none">
                    {formatINR(plan.priceForTwo)}
                  </p>
                </>
              ) : (
                <p className="text-[14px] text-white/80">
                  Pick a plan, or choose “{NOT_SURE_PACKAGE}” and we&apos;ll help you decide.
                </p>
              )}
            </div>
            <p className="mt-5 flex items-start gap-2 text-[13px] text-white/65">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              No payment now — our Kashmir team confirms availability and shares the full itinerary
              first.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <LeadForm
              source="occasion-offer"
              context={{
                offerId: offer.offerId,
                offerSlug: offer.offerSlug,
                offerName: offer.name,
                offerDates: offer.dates ?? undefined,
                packageName: selected ?? undefined,
              }}
              buttonLabel={offer.ctaLabel}
              avatars={formAvatars}
              extraFields={planPicker}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Closing call to action near the end of the page — opens the enquiry modal
// (or WhatsApp) instead of repeating the form inline.
export function OfferClosingCta({ fromPrice }: { fromPrice: number | null }) {
  const { offer, selected, openEnquiry } = useOfferSelection();
  const wa = useWhatsAppLink();
  return (
    <section
      aria-label="Enquire"
      className="relative overflow-hidden rounded-[2rem] bg-brand-dark px-6 py-10 text-white sm:px-12 sm:py-14"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-primary">
            Reserve your {offer.dates ? "dates" : "trip"}
          </p>
          <h2 className="h-display mt-3 text-[28px] font-bold leading-tight sm:text-[38px]">
            {offer.name}
          </h2>
          <p className="mt-2 text-[15px] text-white/75">
            {[offer.dates, fromPrice !== null ? `from ${formatINR(fromPrice)} for 2 adults` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => openEnquiry()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[15px] font-bold text-primary-foreground shadow-glow ring-inner transition hover:brightness-110"
          >
            {offer.ctaLabel}
            <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
          </button>
          <a
            href={wa(offerWhatsAppMessage(offer, selected))}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackWhatsappClick(
                "offer_closing_cta",
                undefined,
                undefined,
                offerClickParams(offer, selected),
              )
            }
            className="glass inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-white/15"
          >
            <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
            Ask on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
