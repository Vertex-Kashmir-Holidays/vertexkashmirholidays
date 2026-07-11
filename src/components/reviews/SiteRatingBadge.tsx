import Image from "next/image";
import { Star } from "lucide-react";

// Compact trust badge for our own (CMS/approved) reviews — same visual
// treatment as GoogleRatingBadge, sits alongside it and the Tripadvisor
// widget in the hero. Not a link (there's nowhere else on this page to send
// the visitor — the full breakdown is already right below the hero).
export function SiteRatingBadge({ average, total }: { average: number; total: number }) {
  if (total === 0) return null;
  return (
    <div className="glass flex h-[52px] shrink-0 items-center gap-2.5 rounded-xl px-5 py-3 text-white">
      <Image src="/brand/svg/vertex-icon-mono-white.svg" alt="" width={28} height={28} className="h-7 w-7 shrink-0" />
      <span className="flex items-center gap-1.5 text-base font-bold">
        {average.toFixed(1)}
        <Star className="h-4 w-4 text-amber-400" strokeWidth={0} fill="currentColor" aria-hidden="true" />
      </span>
      <span className="text-[13px] text-white/75">({total.toLocaleString("en-IN")})</span>
    </div>
  );
}
