"use client";

// A small shared date-range primitive — no dedicated one existed anywhere in
// the app before this (every admin page hand-rolled a pair of <input
// type="date">). Kept intentionally minimal: two native date inputs, a label,
// and a clear affordance — not a calendar-popover component.

interface Props {
  from: string; // "YYYY-MM-DD" or ""
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  label?: string;
}

export function DateRangeFilter({ from, to, onFromChange, onToChange, label = "Date range" }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{label}</span>
      <input
        type="date"
        value={from}
        onChange={(e) => onFromChange(e.target.value)}
        className="py-2 px-2.5 text-xs border border-border rounded-xl bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
        aria-label={`${label} from`}
      />
      <span className="text-xs text-muted-foreground">to</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onToChange(e.target.value)}
        className="py-2 px-2.5 text-xs border border-border rounded-xl bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
        aria-label={`${label} to`}
      />
    </div>
  );
}
