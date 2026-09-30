"use client";

import { useEffect, useState } from "react";
import { Plane, Mountain, Hotel, Compass, MapPin } from "lucide-react";
import { LeadForm, inputBase } from "@/components/leads/LeadForm";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { ensureWhatsAppAttributionToken } from "@/lib/attribution";
import { trackTripRequestStart } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { type RequestedComponent, type LeadSourcePage } from "@/lib/leads/schema";

const CHIP_OPTIONS: { value: RequestedComponent; label: string; Icon: typeof Plane }[] = [
  { value: "TRANSPORT", label: "Flight / Train / Bus", Icon: Plane },
  { value: "TOUR", label: "Kashmir Tour", Icon: Mountain },
  { value: "HOTEL", label: "Hotel / Stay", Icon: Hotel },
];

interface TripPlannerFormProps {
  className?: string;
  /** Overrides Lead.sourcePage — defaults to "trip-planner" (the standalone
   *  page). Origin-city pages pass "tour-origin-city" so this form's
   *  submissions keep reporting under that existing page tag instead of
   *  merging into the standalone page's numbers. */
  source?: LeadSourcePage;
  /**
   * Pre-fills "Travelling from" with a known origin (e.g. an origin-city
   * page already knows the visitor is looking at "...from Mumbai"). Renders
   * a compact, still-editable field ONLY when set — the standalone Trip
   * Planner page never passes this, so its form stays exactly as short as
   * the low-friction spec requires (no origin field shown there at all).
   */
  defaultFromCity?: string;
}

// The public entry point for the whole Trip Planner: intent chips above the
// shared <LeadForm source="trip-planner" />. Deliberately does NOT gate the
// name/phone fields behind a selection — the initial form stays low-friction
// (see the Trip Planner spec: no origin/date/travellers required, no chip
// required either). Chip selection is purely additive context; a submission
// with nothing selected is still a valid lead (requestedComponents simply
// stays unset, same as any pre-Trip-Planner lead).
export function TripPlannerForm({
  className,
  source = "trip-planner",
  defaultFromCity,
}: TripPlannerFormProps) {
  const { formAvatars } = useSiteSettings();
  const [selected, setSelected] = useState<RequestedComponent[]>([]);
  // "Help Me Plan" is its own distinct, undecided intent (["PLAN"]) — never
  // an alias for "all three selected". Mutually exclusive with the chips
  // above: picking one clears the other.
  const [helpMePlan, setHelpMePlan] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [fromCity, setFromCity] = useState(defaultFromCity ?? "");

  const requestedComponents: RequestedComponent[] = helpMePlan ? ["PLAN"] : selected;
  const requestedKey = requestedComponents.join(",");
  const trimmedFromCity = fromCity.trim() || undefined;

  // Keeps the WhatsApp reference token's intent fresh as the visitor changes
  // chips or the (origin-city-prefilled) from-city, so by the time they click
  // "Or chat on WhatsApp" (inside LeadForm), useWhatsAppLink()'s already-
  // reactive tag reflects the current selection — no click-time logic needed
  // in LeadForm itself.
  useEffect(() => {
    if (requestedComponents.length === 0 && !trimmedFromCity) return;
    ensureWhatsAppAttributionToken({ requestedComponents, fromCity: trimmedFromCity });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedKey, trimmedFromCity]);

  function markStarted(intent: RequestedComponent[]) {
    if (hasStarted) return;
    setHasStarted(true);
    trackTripRequestStart(source, intent);
  }

  function toggleChip(value: RequestedComponent) {
    setHelpMePlan(false);
    setSelected((prev) => {
      const next = prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
      markStarted(next.length ? next : [value]);
      return next;
    });
  }

  function toggleHelpMePlan() {
    setSelected([]);
    setHelpMePlan((prev) => {
      const next = !prev;
      if (next) markStarted(["PLAN"]);
      return next;
    });
  }

  return (
    <div
      id="trip-planner-form"
      className={cn(
        "hero-reveal sweep glass-cream w-full max-w-md rounded-3xl p-6 shadow-glass sm:p-7",
        className,
      )}
    >
      <p className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.2em] text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" /> PLAN YOUR KASHMIR TRIP
      </p>
      <h2 className="h-display mt-3 text-[24px] font-bold text-foreground">
        What do you need help with?
      </h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {CHIP_OPTIONS.map(({ value, label, Icon }) => {
          const active = !helpMePlan && selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggleChip(value)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border-2 px-3.5 py-2.5 text-[13px] font-bold transition",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              {label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={toggleHelpMePlan}
        aria-pressed={helpMePlan}
        className={cn(
          "mt-2.5 flex items-center gap-1.5 text-[13px] font-semibold underline-offset-2",
          helpMePlan
            ? "text-primary underline"
            : "text-muted-foreground hover:text-primary hover:underline",
        )}
      >
        <Compass className="h-3.5 w-3.5" strokeWidth={2} />
        Not sure? Help me plan the whole trip
      </button>

      {/* Only rendered when the page already knows the origin (origin-city
        pages) — the standalone Trip Planner page never passes defaultFromCity,
        so this stays absent there, per the low-friction spec. */}
      {defaultFromCity && (
        <div className="mt-4">
          <label
            htmlFor="tp-from-city"
            className="mb-1.5 block text-[13px] font-semibold text-foreground/90"
          >
            Travelling from
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <input
              id="tp-from-city"
              type="text"
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              className={cn(inputBase, "pl-10")}
            />
          </div>
        </div>
      )}

      <div className="mt-5 border-t border-border pt-5">
        <LeadForm
          source={source}
          context={
            requestedComponents.length || trimmedFromCity
              ? { requestedComponents, fromCity: trimmedFromCity }
              : undefined
          }
          kicker={null}
          title={null}
          subtitle="Just your name and number — our team will reach out with real options."
          buttonLabel="Get My Trip Quote"
          avatars={formAvatars}
        />
      </div>
    </div>
  );
}
