"use client";

// Sales lookup view of a rate card — view only, no edit controls. Receives
// toSalesData() output, so cost and profit rules never reach this component.
// Plain placeholder layout: the final design is still to come.
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  PACKAGE_COLUMNS,
  UNION_CAB_VEHICLES,
  formatInr,
  type RateCardSalesData,
  type RateCardSalesTier,
} from "@/lib/rateCards/schema";

const PACKAGE_ROWS = [
  { key: "b2b", label: "B2B" },
  { key: "customer", label: "Customer" },
] as const;

function quoteLine(tier: RateCardSalesTier, data: RateCardSalesData, column: (typeof PACKAGE_COLUMNS)[number], price: number) {
  const { nights, days, pax } = data.basis;
  const option = column.key === "base" ? "" : `, ${column.label.toLowerCase()}`;
  return `${tier.label} — ${nights}N/${days}D for ${pax} pax${option}: ${formatInr(price)}`;
}

function groupByLocation(tier: RateCardSalesTier) {
  const groups = new Map<string, RateCardSalesTier["hotels"]>();
  for (const hotel of tier.hotels) {
    groups.set(hotel.location, [...(groups.get(hotel.location) ?? []), hotel]);
  }
  return [...groups.entries()];
}

export function RateCardSalesView({ data }: { data: RateCardSalesData }) {
  const [tierKey, setTierKey] = useState(data.tiers[0]?.key ?? "");
  const [copied, setCopied] = useState<string | null>(null);
  const tier = data.tiers.find((t) => t.key === tierKey) ?? data.tiers[0];

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    } catch {
      toast.error("Couldn't copy — select the text instead.");
    }
  }

  return (
    <div className="space-y-5">
      {data.basis.note ? <p className="text-[12px] text-muted-foreground">{data.basis.note}</p> : null}

      {data.tiers.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No tiers on this card.
        </p>
      ) : (
        <>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {data.tiers.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTierKey(t.key)}
                className={cn(
                  "shrink-0 rounded-xl border px-3 py-1.5 text-xs font-bold transition",
                  t.key === tier?.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:bg-muted",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tier ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
                <div className="grid grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-1.5 text-sm">
                  <div />
                  {PACKAGE_COLUMNS.map((c) => (
                    <div key={c.key} className="text-center text-[11px] font-semibold text-muted-foreground">
                      {c.label}
                    </div>
                  ))}
                  {PACKAGE_ROWS.map((row) => (
                    <div key={row.key} className="contents">
                      <div className="self-center pr-1 text-xs font-bold text-foreground">{row.label}</div>
                      {PACKAGE_COLUMNS.map((c) => {
                        const price = tier.packages[row.key][c.key];
                        const id = `${row.key}-${c.key}`;
                        return (
                          <button
                            key={c.key}
                            type="button"
                            onClick={() => copy(id, quoteLine(tier, data, c, price))}
                            title="Copy for WhatsApp"
                            className="flex items-center justify-center gap-1 rounded-xl border border-border px-1 py-2.5 font-bold tabular-nums text-foreground hover:bg-muted"
                          >
                            {formatInr(price)}
                            {copied === id ? (
                              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3 shrink-0 text-muted-foreground" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid gap-2 text-[12px] text-muted-foreground sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-foreground">With activities: </span>
                    {data.activitiesIncluded.join(", ") || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">With union cab: </span>
                    {data.unionCabIncluded.join(", ") || "—"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 space-y-3">
                {groupByLocation(tier).map(([location, hotels]) => (
                  <div key={location}>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{location}</p>
                    <ul className="mt-1 divide-y divide-border">
                      {hotels.map((h, i) => (
                        <li key={i} className="flex items-baseline justify-between gap-2 py-1 text-sm">
                          <span className="text-foreground">{h.name}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {formatInr(h.perNight)}
                            {h.extraBed != null ? ` · EB ${formatInr(h.extraBed)}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {tier.hotels.length === 0 ? <p className="text-sm text-muted-foreground">No hotels listed.</p> : null}
              </div>
            </div>
          ) : null}
        </>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
          <p className="mb-2 text-xs font-bold text-foreground">Union cabs</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-muted-foreground">
                <th className="py-1 text-left font-semibold">Route</th>
                {UNION_CAB_VEHICLES.map((v) => (
                  <th key={v.key} className="py-1 text-right font-semibold">
                    {v.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.unionCabs.map((cab, i) => (
                <tr key={i}>
                  <td className="py-1.5 text-foreground">{cab.route}</td>
                  {UNION_CAB_VEHICLES.map((v) => (
                    <td key={v.key} className="py-1.5 text-right tabular-nums text-foreground">
                      {cab.rates[v.key] != null ? formatInr(cab.rates[v.key]!) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
          <p className="mb-2 text-xs font-bold text-foreground">Vehicles (per day)</p>
          <ul className="divide-y divide-border text-sm">
            {data.vehicles.map((v, i) => (
              <li key={i} className="flex justify-between py-1.5">
                <span className="text-foreground">{v.name}</span>
                <span className="tabular-nums text-foreground">{formatInr(v.price)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
