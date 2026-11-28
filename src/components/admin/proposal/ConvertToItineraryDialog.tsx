"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, ExternalLink, Loader2, RefreshCw } from "lucide-react";
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
  onConvert: (tier: ProposalTierKey, leadId: string, hotelPicks: Record<string, string>) => void;
  /** Multi-package: the options to pick the accepted one from. Empty = single-package. */
  options: { key: ProposalTierKey; label: string }[];
  /** Stay-plan rows with their hotel choices per option (single-package uses "premium"). */
  stays: { id: string; destination: string; choices: Partial<Record<ProposalTierKey, string[]>> }[];
  isConverting?: boolean;
}

const fieldCls =
  "w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";
const labelCls =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

/**
 * Asks which option was accepted and which lead the itinerary belongs to.
 * Only leads without an itinerary are listed (same pool as the itinerary
 * editor's Link panel). A lead not created yet is created in a new tab, then
 * picked here after Refresh.
 */
export function ConvertToItineraryDialog({
  open,
  onClose,
  onConvert,
  options,
  stays,
  isConverting,
}: Props) {
  const [tier, setTier] = useState<ProposalTierKey>("premium");
  // Every stay with hotels for the chosen option: a single hotel is taken as
  // is; with several the user must pick the final one before converting.
  const [picks, setPicks] = useState<Record<string, string>>({});
  const hotelStays = stays
    .map((st) => ({ ...st, list: st.choices[tier] ?? [] }))
    .filter((st) => st.list.length > 0);
  const pickOf = (st: { id: string; list: string[] }) =>
    st.list.length === 1 ? st.list[0] : st.list.includes(picks[st.id]) ? picks[st.id] : "";
  const unpicked = hotelStays.filter((st) => !pickOf(st)).length;
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

  // Fresh choice each time the dialog opens.
  useEffect(() => {
    if (open) setPicks({});
  }, [open]);

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
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="convert-title"
        className="relative max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl"
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

        {hotelStays.length > 0 && (
          <div className="space-y-3">
            <div>
              <p className={labelCls + " mb-0"}>Final hotels</p>
              <p className="text-[11px] text-muted-foreground">
                Pick the hotel confirmed for each stay — only it goes into the itinerary.
              </p>
            </div>
            {hotelStays.map((st) => (
              <div key={st.id}>
                <p className="mb-1 text-[12px] font-semibold text-foreground">{st.destination}</p>
                <div
                  className="flex flex-wrap gap-1.5"
                  role="radiogroup"
                  aria-label={`Hotel for ${st.destination}`}
                >
                  {st.list.map((h) => {
                    const on = pickOf(st) === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setPicks((p) => ({ ...p, [st.id]: h }))}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition ${
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        {on && <Check className="h-3 w-3" />}
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
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
              {loading
                ? "Loading…"
                : leads.length === 0
                  ? "No leads without an itinerary"
                  : "— Select lead —"}
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

        {unpicked > 0 && (
          <p className="text-right text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            Pick the final hotel for {unpicked} {unpicked === 1 ? "stay" : "stays"} to convert.
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isConverting}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() =>
              onConvert(
                tier,
                leadId,
                Object.fromEntries(hotelStays.map((st) => [st.id, pickOf(st)])),
              )
            }
            disabled={!leadId || unpicked > 0 || isConverting}
            title={unpicked > 0 ? "Pick the final hotel for every stay" : undefined}
          >
            {isConverting && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
            Convert
          </Button>
        </div>
      </div>
    </div>
  );
}
