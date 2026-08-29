"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Plane, MapPin, Calendar, Users, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/organisms/dialog";
import { LeadForm, inputBase } from "@/components/leads/LeadForm";
import { trackFlightTrainQuoteClick } from "@/lib/analytics";
import { EASE_BRAND as EASE } from "@/lib/motion";
import { TRANSPORT_FEATURES } from "@/lib/transport/data";

// Every on-page instance of this banner, for analytics + so sales can tell
// (via Lead.notes) which page a quote request came from — see
// PLACEMENT_LABEL in src/app/api/leads/route.ts, which must stay in sync.
export type TransportAssistancePlacement =
  | "tour-detail"
  | "homepage"
  | "tour-listing"
  | "things-to-do"
  | "adventures"
  | "travel-stories"
  | "city-page";

interface TransportAssistanceBannerProps {
  placement: TransportAssistancePlacement;
  /** "default": full card (icon, heading, CTA) used on content pages.
   *  "sidebar": compact info block for the tour-listing filter sidebar —
   *  intentionally NOT a functional filter (flight/train assistance is a
   *  sitewide service, not a per-tour attribute, so filtering by it would
   *  always return every tour). */
  variant?: "default" | "sidebar";
  /** Present when embedded on a tour detail page; omitted elsewhere. */
  tourId?: string;
  tourName?: string;
  /** Origin-city pages already know the departure city — prefills the field
   *  (still editable) instead of making the visitor retype it. */
  defaultFromCity?: string;
  className?: string;
}

type TransportMode = "FLIGHT" | "TRAIN" | "EITHER";

const MODES: { value: TransportMode; label: string }[] = [
  { value: "FLIGHT", label: "Flight" },
  { value: "TRAIN", label: "Train" },
  { value: "EITHER", label: "Either" },
];

const today = () => new Date().toISOString().split("T")[0];

// We have B2B flight/train access (Akbar, Riya, TripJack) but no live fare
// API/widget from them — so this can never show real-time prices. Instead of
// a bare "flights not included" notice, this turns that gap into a value-add:
// capture just enough trip detail for sales to pull an actual fare from the
// B2B portals and follow up. Reuses the same <LeadForm /> + /api/leads pipeline
// as every other enquiry on the site — no parallel system. If a fare API is
// ever wired up, this card is the natural place to swap in live pricing.
// Rendered server-side like the rest of the page content (this is a "use
// client" component only for its interactivity, not for its markup), so the
// copy below is fully crawlable. One component, reused across every page that
// wants transport-assistance messaging — see `placement`/`variant` above.
export function TransportAssistanceBanner({
  placement,
  variant = "default",
  tourId,
  tourName,
  defaultFromCity,
  className,
}: TransportAssistanceBannerProps) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [fromCity, setFromCity] = useState(defaultFromCity ?? "");
  const [mode, setMode] = useState<TransportMode>("EITHER");
  const [travelDate, setTravelDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [travellers, setTravellers] = useState("2");

  function openQuote() {
    trackFlightTrainQuoteClick(placement, tourName);
    setOpen(true);
  }

  return (
    <>
      {variant === "sidebar" ? (
        <div className={`mt-7 border-t border-border pt-6 ${className ?? ""}`}>
          <p className="text-[16px] font-bold text-foreground">Transport Assistance</p>
          <ul className="mt-3.5 space-y-2 text-[14px] text-foreground/85">
            {TRANSPORT_FEATURES.flightAssistance && (
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                Flight assistance available
              </li>
            )}
            {TRANSPORT_FEATURES.trainAssistance && (
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                Train assistance available
              </li>
            )}
          </ul>
          <p className="mt-2 text-[12px] text-muted-foreground">
            Fare is separate from the package price.
          </p>
          <button
            type="button"
            onClick={openQuote}
            className="mt-3 text-[13px] font-bold text-primary hover:underline"
          >
            Get a Flight/Train Quote →
          </button>
        </div>
      ) : (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: EASE }}
          className={`mt-6 flex flex-col items-start gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-soft sm:flex-row sm:items-center sm:p-6 ${className ?? ""}`}
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <Plane className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="flex-1">
            <h3 className="text-[16px] font-bold text-foreground sm:text-[17px]">
              Planning your journey to Kashmir?
            </h3>
            <p className="mt-1 text-[14px] leading-snug text-muted-foreground">
              We can arrange your flight or train tickets from Delhi, Mumbai, Bengaluru, Hyderabad,
              Kolkata and other cities through our travel partners.
            </p>
            <p className="mt-1.5 text-[12px] italic text-muted-foreground/80">
              Ticket fare is separate from this package and depends on your travel dates &amp;
              availability.
            </p>
          </div>
          <button
            type="button"
            onClick={openQuote}
            className="ring-inner w-full shrink-0 rounded-xl bg-primary px-5 py-3 text-[14px] font-bold text-primary-foreground shadow-glow transition hover:brightness-110 sm:w-auto"
          >
            Get a Flight/Train Quote
          </button>
        </motion.div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[18px]">Get a Flight/Train Quote</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Share a few trip details — our team will check live fares on our airline/rail partner
            portals and share the best options on WhatsApp.
          </DialogDescription>

          <div className="space-y-3">
            <div>
              <label htmlFor="ftq-from" className="mb-1.5 block text-[14px] font-semibold">
                Departure City
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                <input
                  id="ftq-from"
                  type="text"
                  placeholder="e.g. Delhi, Mumbai, Bengaluru"
                  value={fromCity}
                  onChange={(e) => setFromCity(e.target.value)}
                  className={`${inputBase} pl-10`}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[14px] font-semibold">Flight / Train</label>
              <div className="grid grid-cols-3 gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMode(m.value)}
                    className={`rounded-xl border py-2.5 text-[13px] font-bold transition ${
                      mode === m.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ftq-depart" className="mb-1.5 block text-[14px] font-semibold">
                  Travel Date
                </label>
                <div className="flex items-center overflow-hidden rounded-xl border border-input bg-card transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
                  <input
                    id="ftq-depart"
                    type="date"
                    min={today()}
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full bg-transparent px-3 py-3 text-[14px] outline-none [color-scheme:light] dark:[color-scheme:dark]"
                  />
                  <Calendar className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label htmlFor="ftq-return" className="mb-1.5 block text-[14px] font-semibold">
                  Return Date <span className="font-medium text-muted-foreground">(optional)</span>
                </label>
                <div className="flex items-center overflow-hidden rounded-xl border border-input bg-card transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
                  <input
                    id="ftq-return"
                    type="date"
                    min={travelDate || today()}
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full bg-transparent px-3 py-3 text-[14px] outline-none [color-scheme:light] dark:[color-scheme:dark]"
                  />
                  <Calendar className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="ftq-pax" className="mb-1.5 block text-[14px] font-semibold">
                Travellers
              </label>
              <div className="relative">
                <Users className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                <select
                  id="ftq-pax"
                  value={travellers}
                  onChange={(e) => setTravellers(e.target.value)}
                  className={`${inputBase} appearance-none pl-10`}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <LeadForm
            source="flight-train-quote"
            context={{
              ...(tourId ? { tourId } : {}),
              ...(tourName ? { tourName } : {}),
              fromCity: fromCity || undefined,
              transportMode: mode,
              travelDate: travelDate || undefined,
              returnDate: returnDate || undefined,
              travellers: Number(travellers) || undefined,
              placement,
            }}
            buttonLabel="Get My Quote"
            note="Free, no spam — our team replies with real fare options on WhatsApp."
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
