import { FileDown } from "lucide-react";

/** Download link for a staff-uploaded itinerary PDF (customer / agent pages). */
export function ManualItineraryLink({ url, name }: { url: string; name: string | null }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-muted"
    >
      <FileDown className="h-4 w-4 text-primary" />
      <span className="max-w-[220px] truncate">{name?.replace(/\.pdf$/i, "") || "Itinerary"}</span>
      <span className="text-[11px] font-semibold text-muted-foreground">PDF</span>
    </a>
  );
}
