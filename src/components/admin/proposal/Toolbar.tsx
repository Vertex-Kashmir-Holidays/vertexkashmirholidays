"use client";

import Link from "next/link";
import { Button } from "@/components/ui/atoms/button";
import { RefreshCw, Download, Save, Loader2, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/atoms/ThemeToggle";
import type { ProposalDocType, ProposalStatus } from "@/types/proposal";

const STATUSES: ProposalStatus[] = ["DRAFT", "SENT"];
const DOC_TYPES: { value: ProposalDocType; label: string }[] = [
  { value: "single", label: "Single-package" },
  { value: "multi", label: "Multi-package" },
];

interface ToolbarProps {
  title: string;
  onTitleChange: (v: string) => void;
  status: ProposalStatus;
  onStatusChange: (v: ProposalStatus) => void;
  docType: ProposalDocType;
  onDocTypeChange: (v: ProposalDocType) => void;
  onSave: () => void;
  onExport: () => void;
  onReset: () => void;
  isSaving?: boolean;
  isExporting?: boolean;
  canSave?: boolean;
}

export function Toolbar({
  title,
  onTitleChange,
  status,
  onStatusChange,
  docType,
  onDocTypeChange,
  onSave,
  onExport,
  onReset,
  isSaving,
  isExporting,
  canSave = true,
}: ToolbarProps) {
  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 no-print">
      <div className="mx-auto flex max-w-[900px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-5">
        <div className="flex min-w-0 flex-1 basis-[180px] items-center gap-3">
          <Link
            href="/admin/proposals"
            className="text-muted-foreground transition hover:text-foreground"
            aria-label="Back to list"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Proposal title"
            className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-bold text-foreground transition focus:border-border focus:bg-muted/40 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="radiogroup"
            aria-label="Proposal type"
            className="flex items-center rounded-lg border border-border bg-card p-0.5 text-[12px] font-semibold"
          >
            {DOC_TYPES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={docType === opt.value}
                onClick={() => onDocTypeChange(opt.value)}
                className={`rounded-md px-2.5 py-1 transition ${
                  docType === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as ProposalStatus)}
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

          <Button variant="outline" size="sm" onClick={onExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1 h-3.5 w-3.5" />
            )}
            PDF
          </Button>

          <Button size="sm" onClick={onSave} disabled={isSaving || !canSave}>
            {isSaving ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1 h-3.5 w-3.5" />
            )}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
