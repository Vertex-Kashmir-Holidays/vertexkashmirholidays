"use client";

import Link from "next/link";
import { Button } from "@/components/ui/atoms/button";
import { RefreshCw, Download, Save, Loader2, ArrowLeft, MoreHorizontal, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/organisms/dropdown-menu";
import { ThemeToggle } from "@/components/ui/atoms/ThemeToggle";
import type { ItineraryStatus } from "@/types/itinerary";

const STATUSES: ItineraryStatus[] = ["DRAFT", "SENT", "CONFIRMED"];
const STATUS_LABEL: Record<ItineraryStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  CONFIRMED: "Confirmed",
};

interface ToolbarProps {
  /** Generated from the customer name, duration and phone — not editable by hand. */
  title: string;
  status: ItineraryStatus;
  onStatusChange: (v: ItineraryStatus) => void;
  onSave: () => void;
  onExport: () => void;
  onReset: () => void;
  isSaving?: boolean;
  isExporting?: boolean;
  canSave?: boolean;
}

export function Toolbar({
  title,
  status,
  onStatusChange,
  onSave,
  onExport,
  onReset,
  isSaving,
  isExporting,
  canSave = true,
}: ToolbarProps) {
  const pdfButton = (
    <Button variant="outline" size="sm" onClick={onExport} disabled={isExporting}>
      {isExporting ? (
        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="mr-1 h-3.5 w-3.5" />
      )}
      PDF
    </Button>
  );
  const saveButton = (
    <Button size="sm" onClick={onSave} disabled={isSaving || !canSave}>
      {isSaving ? (
        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Save className="mr-1 h-3.5 w-3.5" />
      )}
      Save
    </Button>
  );

  // Pinned while scrolling (same as the proposal toolbar). Phones: one row —
  // Back · title · PDF · Save · ⋯ (status / Reset). sm+: the full row.
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 no-print">
      <div className="mx-auto flex max-w-[900px] flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:px-5 sm:py-3">
        <div className="flex min-w-0 flex-1 basis-[180px] items-center gap-3 max-sm:basis-full max-sm:gap-2">
          <Link
            href="/admin/itinerary"
            className="text-muted-foreground transition hover:text-foreground"
            aria-label="Back to list"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <p
            title="Named automatically from the customer name, duration and phone"
            className="min-w-0 flex-1 truncate px-2 py-1 text-sm font-bold text-foreground max-sm:px-0"
          >
            {title}
          </p>
          <div className="flex shrink-0 items-center gap-1.5 sm:hidden">
            {pdfButton}
            {saveButton}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="px-2" aria-label="More actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {STATUSES.map((sVal) => (
                  <DropdownMenuItem
                    key={sVal}
                    onSelect={() => onStatusChange(sVal)}
                    disabled={status === sVal}
                  >
                    <Check className={`h-4 w-4 ${status === sVal ? "" : "invisible"}`} />
                    {STATUS_LABEL[sVal]}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onReset}>
                  <RefreshCw className="h-4 w-4" /> Reset
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 max-sm:hidden">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as ItineraryStatus)}
            aria-label="Status"
            className="rounded-lg border border-border bg-card px-2 py-1.5 text-[12px] font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          >
            {STATUSES.map((sVal) => (
              <option key={sVal} value={sVal}>
                {sVal}
              </option>
            ))}
          </select>

          <ThemeToggle className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground" />

          <Button variant="outline" size="sm" onClick={onReset}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Reset
          </Button>

          {pdfButton}
          {saveButton}
        </div>
      </div>
    </div>
  );
}
