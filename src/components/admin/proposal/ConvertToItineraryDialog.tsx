"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import type { ProposalTierKey } from "@/types/proposal";

interface LinkableLead {
  id: string;
  name: string;
  phone: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConvert: (tier: ProposalTierKey, leadId: string) => void;
  /** Multi-package: the options to pick the accepted one from. Empty = single-package. */
  options: { key: ProposalTierKey; label: string }[];
  isConverting?: boolean;
}

const fieldCls =
  "w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";
const labelCls = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

/**
 * Asks which option was accepted and which lead the itinerary belongs to.
 * Only leads without an itinerary are listed (same pool as the itinerary
 * editor's Link panel). A lead not created yet is created in a new tab, then
 * picked here after Refresh.
 */
export function ConvertToItineraryDialog({ open, onClose, onConvert, options, isConverting }: Props) {
  const [tier, setTier] = useState<ProposalTierKey>("premium");
  const [leads, setLeads] = useState<LinkableLead[]>([]);
  const [leadId, setLeadId] = useState("");
  const [loading, setLoading] = useState(false);

  const loadLeads = useCallback(() => {
    setLoading(true);
    fetch("/api/itineraries/linkable")
      .then((res) => res.json())
      .then((j: { leads?: LinkableLead[] }) => setLeads(j.leads ?? []))
      .catch(() => toast.error("Failed to load leads."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (open) loadLeads();
  }, [open, loadLeads]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 no-print">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="convert-title"
        className="relative w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <div>
          <h2 id="convert-title" className="text-base font-bold text-foreground">
            Convert to Itinerary
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Creates the lead&apos;s itinerary pre-filled from this proposal.
          </p>
        </div>

        {options.length > 0 && (
          <div>
            <label htmlFor="convert-tier" className={labelCls}>
              Accepted option
            </label>
            <select
              id="convert-tier"
              value={tier}
              onChange={(e) => setTier(e.target.value as ProposalTierKey)}
              className={fieldCls}
            >
              {options.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="convert-lead" className={labelCls + " mb-0"}>
              Lead
            </label>
            <div className="flex items-center gap-3 text-[12px] font-semibold">
              <a
                href="/admin/leads/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Create lead <ExternalLink className="h-3 w-3" />
              </a>
              <button
                type="button"
                onClick={loadLeads}
                disabled={loading}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>
          </div>
          <select
            id="convert-lead"
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            disabled={loading || leads.length === 0}
            className={fieldCls}
          >
            <option value="">
              {loading ? "Loading…" : leads.length === 0 ? "No leads without an itinerary" : "— Select lead —"}
            </option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} · {l.phone}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Only leads that don&apos;t have an itinerary yet are listed.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isConverting}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => onConvert(tier, leadId)} disabled={!leadId || isConverting}>
            {isConverting && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
            Convert
          </Button>
        </div>
      </div>
    </div>
  );
}
