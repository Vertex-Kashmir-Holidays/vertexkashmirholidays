"use client";

import { useState } from "react";
import { IdCard } from "lucide-react";
import { SALUTATIONS, splitSalutation, type Salutation } from "@/lib/welcomeCard/salutation";

/**
 * Downloads the guest welcome card (driver's arrival name board) with a title
 * in front of the name. The booking doesn't record gender, so the title is
 * picked here — pre-selected when the name already starts with one.
 */
export function WelcomeCardButton({ bookingId, guestName }: { bookingId: string; guestName: string }) {
  const [title, setTitle] = useState<Salutation | "none" | "">(() => splitSalutation(guestName).title ?? "");

  return (
    <span className="inline-flex items-center overflow-hidden rounded-lg border border-border text-xs font-semibold">
      <select
        value={title}
        onChange={(e) => setTitle(e.target.value as Salutation | "none" | "")}
        aria-label="Title before the guest's name"
        className="h-8 border-r border-border bg-transparent px-2 text-foreground outline-none"
      >
        <option value="" disabled>
          Title…
        </option>
        {SALUTATIONS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
        <option value="none">No title</option>
      </select>
      {title ? (
        <a
          href={`/api/bookings/${bookingId}/welcome-card?title=${title}`}
          className="inline-flex h-8 items-center gap-1.5 px-3 text-foreground hover:text-primary transition"
        >
          <IdCard className="w-4 h-4" /> Welcome card
        </a>
      ) : (
        <span
          className="inline-flex h-8 items-center gap-1.5 px-3 text-muted-foreground"
          title="Pick Mr / Ms / Mrs / Dr first"
        >
          <IdCard className="w-4 h-4" /> Welcome card
        </span>
      )}
    </span>
  );
}
