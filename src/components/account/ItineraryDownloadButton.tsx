"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { itineraryDataSchema } from "@/types/itinerary";

interface Props {
  bookingId: string;
}

export function ItineraryDownloadButton({ bookingId }: Props) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/account/bookings/${bookingId}/itinerary`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not load your itinerary.");

      const data = itineraryDataSchema.parse(json.data);
      // Loaded on demand — keeps the heavy PDF renderer out of the account bundle
      // until a customer actually downloads.
      const { downloadItineraryPdf } = await import("@/lib/itinerary/export-pdf");
      await downloadItineraryPdf(data);
      toast.success("Itinerary downloaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {downloading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      Download Itinerary (PDF)
    </button>
  );
}
