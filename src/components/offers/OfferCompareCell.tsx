import { Check, Minus } from "lucide-react";

// One Compare Plans value, as plain data so the server-built table and the
// client mobile view render it identically.
export type CompareCell =
  | { kind: "included" }
  | { kind: "none" }
  | { kind: "nights"; nights: number }
  | { kind: "text"; text: string; strong?: boolean };

export interface CompareRowData {
  label: string;
  cells: CompareCell[];
  /** Heading-style bold row, e.g. "Stay class". */
  emphasis?: boolean;
}

export interface CompareSectionData {
  title: string | null;
  rows: CompareRowData[];
}

export function CompareCellView({ cell }: { cell: CompareCell }) {
  switch (cell.kind) {
    case "included":
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
          <Check className="h-4 w-4" strokeWidth={2.5} /> Included
        </span>
      );
    case "none":
      return (
        <Minus
          className="inline-block h-4 w-4 text-muted-foreground/60"
          aria-label="Not included"
        />
      );
    case "nights":
      return (
        <span className="inline-flex items-center gap-1 font-semibold">
          <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} /> {cell.nights}N
        </span>
      );
    case "text":
      return cell.strong ? (
        <b className="text-[15px] text-foreground">{cell.text}</b>
      ) : (
        <span className="font-medium">{cell.text}</span>
      );
  }
}
