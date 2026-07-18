// src/components/sections/TourDetailsTravelInfo.tsx
// Server component — no 'use client', no framer-motion. The accordion items
// use native <details>, so this section ships zero extra JS.
import { AlertTriangle } from "lucide-react";
import { TourDetailsAccordionItem } from "./TourDetailsAccordionItem";
import type { PackingItem, ImportantNote } from "@/types/tours";

interface TourDetailsTravelInfoProps {
  bestTimeDetail?: string;
  thingsToCarry: PackingItem[];
  localTravelTips: string[];
  importantNotes: ImportantNote[];
}

export function TourDetailsTravelInfo({
  bestTimeDetail,
  thingsToCarry,
  localTravelTips,
  importantNotes,
}: TourDetailsTravelInfoProps) {
  const hasBestTime = Boolean(bestTimeDetail);
  const hasCarry = thingsToCarry.length > 0;
  const hasTips = localTravelTips.length > 0;
  const hasNotes = importantNotes.length > 0;
  if (!hasBestTime && !hasCarry && !hasTips && !hasNotes) return null;

  return (
    <section
      id="travel-info"
      className="mt-6 rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
    >
      <h2 className="text-[18px] font-bold">Travel Information</h2>
      <div className="mt-4 space-y-3">
        {hasBestTime && (
          <TourDetailsAccordionItem title="Best Time to Visit">
            <p>{bestTimeDetail}</p>
          </TourDetailsAccordionItem>
        )}

        {hasCarry && (
          <TourDetailsAccordionItem title="Things to Carry">
            <ul className="space-y-2.5">
              {thingsToCarry.map((row, i) => (
                <li key={i} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{row.item}</p>
                    <p className="text-foreground/65">{row.reason}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                      row.mandatory ? "bg-primary/10 text-primary" : "bg-muted text-foreground/60"
                    }`}
                  >
                    {row.mandatory ? "Mandatory" : "Optional"}
                  </span>
                </li>
              ))}
            </ul>
          </TourDetailsAccordionItem>
        )}

        {hasTips && (
          <TourDetailsAccordionItem title="Local Travel Tips">
            <ol className="space-y-2.5">
              {localTravelTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-muted text-[12px] font-bold text-foreground/70">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ol>
          </TourDetailsAccordionItem>
        )}

        {hasNotes && (
          <TourDetailsAccordionItem title="Important Notes">
            <ul className="space-y-2.5">
              {importantNotes.map((note, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                    strokeWidth={2}
                  />
                  {note.text}
                </li>
              ))}
            </ul>
          </TourDetailsAccordionItem>
        )}
      </div>
    </section>
  );
}
