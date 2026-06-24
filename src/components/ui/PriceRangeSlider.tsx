'use client';

import { formatINR } from '@/lib/accents';

// Dual-handle price slider. Two overlaid native range inputs (accessible +
// keyboard-friendly); the `.price-range` CSS in globals makes only the thumbs
// interactive so both handles work despite overlapping. Shared by the Tours and
// Activities listing filters.
export function PriceRangeSlider({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (r: [number, number]) => void;
}) {
  if (max <= min) return null; // single price point → nothing to filter
  const [lo, hi] = value;
  const span = max - min;
  const loPct = ((lo - min) / span) * 100;
  const hiPct = ((hi - min) / span) * 100;

  return (
    <>
      <div className="relative mt-5 h-6">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-muted" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${loPct}%`, right: `${100 - hiPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi - step), hi])}
          className="price-range absolute inset-0 w-full"
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + step)])}
          className="price-range absolute inset-0 w-full"
          aria-label="Maximum price"
        />
      </div>
      <div className="mt-3 flex justify-between text-[12px] font-semibold text-foreground/80">
        <span>{formatINR(lo)}</span>
        <span>{formatINR(hi)}</span>
      </div>
    </>
  );
}
