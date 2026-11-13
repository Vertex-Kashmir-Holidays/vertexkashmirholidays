"use client";

import { Fragment } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PACKAGE_COLUMNS,
  costFromBuildUp,
  formatInr,
  gstOn,
  priceFromCost,
  stayRate,
  type PackageSet,
  type RateCardData,
  type RateCardTier,
} from "@/lib/rateCards/schema";
import { AddRowButton, AmountInput, RowActions, cellCls, moveItem, replaceAt } from "./fields";

/** Rendered once by RateCardEditor so every tier's location input shares it. */
export const LOCATIONS_LIST_ID = "rate-card-locations";

interface Props {
  tier: RateCardTier;
  index: number;
  count: number;
  minProfit: RateCardData["minProfit"];
  gstPercent: number;
  /** The whole card — for the cost build-up (basis, cab, activities, union cab). */
  card: RateCardData;
  warningCount: number;
  open: boolean;
  onToggle: () => void;
  onChange: (tier: RateCardTier) => void;
  onMove: (delta: -1 | 1) => void;
  onDelete: () => void;
}

export function TierEditor({
  tier,
  index,
  count,
  minProfit,
  gstPercent,
  card,
  warningCount,
  open,
  onToggle,
  onChange,
  onMove,
  onDelete,
}: Props) {
  const setCost = (key: keyof PackageSet, value: number) =>
    onChange({ ...tier, cost: { ...tier.cost, [key]: value } });
  // With a night split the cost is calculated (hotels + cab + activities +
  // union cab); otherwise it is typed by hand.
  const built = costFromBuildUp(tier, card);
  const cost = built ? built.cost : tier.cost;
  const splitNights = tier.stay.reduce((n, s) => n + s.nights, 0);
  const tierLocations = [...new Set(tier.hotels.map((h) => h.location.trim()).filter(Boolean))];
  const setStay = (stay: RateCardTier["stay"]) => onChange({ ...tier, stay });

  return (
    <div className="rounded-2xl border border-border">
      <div className="flex items-center gap-2 p-3">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition", open ? "" : "-rotate-90")} />
          <span className="truncate text-sm font-bold text-foreground">{tier.label || "Untitled tier"}</span>
          <span className="shrink-0 text-[12px] text-muted-foreground">{tier.hotels.length} hotels</span>
          {warningCount > 0 ? (
            <span className="shrink-0 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
              {warningCount} warning{warningCount === 1 ? "" : "s"}
            </span>
          ) : null}
        </button>
        <RowActions index={index} count={count} label="tier" onMove={onMove} onDelete={onDelete} />
      </div>

      {open ? (
        <div className="space-y-5 border-t border-border p-3 sm:p-4">
          <div className="max-w-xs">
            <label className="block text-[12px] font-semibold text-muted-foreground mb-1">Tier name</label>
            <input
              value={tier.label}
              onChange={(e) => onChange({ ...tier, label: e.target.value })}
              className={cellCls}
            />
          </div>

          {/* Night split → cost build-up */}
          <div className="rounded-xl border border-dashed border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold text-foreground">
                Night split{" "}
                <span className="font-medium text-muted-foreground">
                  ({card.basis.nights}N/{card.basis.days}D — each night at the lowest listed hotel rate)
                </span>
              </p>
              {tier.stay.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setStay(tierLocations.map((location) => ({ location, nights: 0 })))}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Calculate cost from nights
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStay([])}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Enter cost by hand instead
                </button>
              )}
            </div>
            {tier.stay.length > 0 && (
              <>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {tier.stay.map((st, i) => {
                    const rate = stayRate(tier, st.location);
                    return (
                      <div key={i} className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5">
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{st.location}</span>
                        <input
                          type="number"
                          min={0}
                          value={st.nights}
                          onChange={(e) =>
                            setStay(replaceAt(tier.stay, i, { ...st, nights: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                          }
                          className="w-14 rounded-md border border-border bg-background px-1.5 py-1 text-right text-xs"
                          aria-label={`${st.location} nights`}
                        />
                        <span className="text-[11px] text-muted-foreground">
                          N × {rate == null ? "no rate" : formatInr(rate)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {built && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Hotels {formatInr(built.hotels)} + {card.costBuild.vehicle} {formatInr(built.cab)} = Base{" "}
                    {formatInr(built.cost.base)} · + activities {formatInr(built.activities)} · + union cab{" "}
                    {formatInr(built.unionCab)}
                  </p>
                )}
                {splitNights !== card.basis.nights && (
                  <p className="mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    Night split adds up to {splitNights}N, the basis is {card.basis.nights}N.
                  </p>
                )}
                {built && built.missing.length > 0 && (
                  <p className="mt-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
                    No hotel rate listed for: {built.missing.join(", ")}.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Package prices — staff enter the internal cost; B2B and customer
              prices are calculated: cost + profit, then GST on top. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-[12px] text-muted-foreground">
                  <th className="py-1.5 pr-2 text-left font-semibold">Package price</th>
                  {PACKAGE_COLUMNS.map((c) => (
                    <th key={c.key} className="px-1 py-1.5 text-right font-semibold">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1 pr-2 text-foreground">
                    <span className="font-semibold">Cost</span>
                    <span className="ml-1.5 text-[11px] text-muted-foreground">internal</span>
                  </td>
                  {PACKAGE_COLUMNS.map((c) => (
                    <td key={c.key} className="px-1 py-1">
                      {built ? (
                        <p className="px-2 py-1.5 text-right text-sm font-bold tabular-nums text-foreground" title="Calculated from the night split">
                          {formatInr(cost[c.key])}
                        </p>
                      ) : (
                        <AmountInput
                          ariaLabel={`cost ${c.label}`}
                          value={tier.cost[c.key] || null}
                          nullable
                          onChange={(v) => setCost(c.key, v ?? 0)}
                        />
                      )}
                    </td>
                  ))}
                </tr>
                {(["b2b", "customer"] as const).map((row) => {
                  const rowLabel = row === "b2b" ? "B2B" : "Customer";
                  const profit = minProfit[row];
                  const cell = (key: keyof PackageSet, value: (cost: number) => number) => {
                    const c0 = cost[key];
                    return c0 > 0 ? formatInr(value(c0)) : "—";
                  };
                  return (
                    <Fragment key={row}>
                      <tr className="border-t border-dashed border-border text-[12px]">
                        <td className="pt-2 pb-1 pr-2 text-muted-foreground">
                          {rowLabel} profit <span className="ml-1">(+{formatInr(profit)})</span>
                        </td>
                        {PACKAGE_COLUMNS.map((c) => (
                          <td key={c.key} className="px-3 pt-2 pb-1 text-right tabular-nums text-foreground/80">
                            {cell(c.key, (cost) => cost + profit)}
                          </td>
                        ))}
                      </tr>
                      <tr className="text-[12px]">
                        <td className="py-1 pr-2 text-muted-foreground">
                          {rowLabel} GST ({gstPercent}%, included)
                        </td>
                        {PACKAGE_COLUMNS.map((c) => (
                          <td key={c.key} className="px-3 py-1 text-right tabular-nums text-muted-foreground">
                            {cell(c.key, (cost) => gstOn(cost, profit, gstPercent))}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-1.5 pr-2 font-semibold text-foreground">{rowLabel} price</td>
                        {PACKAGE_COLUMNS.map((c) => {
                          const colCost = cost[c.key];
                          const stored = tier.packages[row][c.key];
                          return (
                            <td
                              key={c.key}
                              className="px-3 py-1.5 text-right font-bold tabular-nums text-foreground"
                              title={colCost > 0 ? undefined : "Enter the cost to calculate this price"}
                            >
                              {colCost > 0 ? (
                                formatInr(priceFromCost(colCost, profit, gstPercent))
                              ) : (
                                <span className="font-normal text-muted-foreground">
                                  {stored > 0 ? `${formatInr(stored)} · set cost` : "—"}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Hotels */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground">Hotels</p>
            {tier.hotels.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-[12px] text-muted-foreground">
                No hotels yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className="text-[12px] text-muted-foreground">
                      <th className="py-1.5 pr-1 text-left font-semibold">Location</th>
                      <th className="px-1 py-1.5 text-left font-semibold">Hotel</th>
                      <th className="px-1 py-1.5 text-right font-semibold">Per night</th>
                      <th className="px-1 py-1.5 text-right font-semibold">Extra bed</th>
                      <th className="px-1 py-1.5 text-right font-semibold" title="Child 6–12 years, no extra bed">
                        CNB (6–12 yrs)
                      </th>
                      <th className="px-1 py-1.5 text-right font-semibold">Family room</th>
                      <th className="w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {tier.hotels.map((hotel, i) => {
                      const setHotel = (patch: Partial<typeof hotel>) =>
                        onChange({ ...tier, hotels: replaceAt(tier.hotels, i, { ...hotel, ...patch }) });
                      return (
                        <tr key={i}>
                          <td className="w-36 py-1 pr-1">
                            <input
                              list={LOCATIONS_LIST_ID}
                              value={hotel.location}
                              onChange={(e) => setHotel({ location: e.target.value })}
                              className={cellCls}
                              aria-label="Location"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              value={hotel.name}
                              onChange={(e) => setHotel({ name: e.target.value })}
                              className={cellCls}
                              aria-label="Hotel name"
                            />
                          </td>
                          <td className="w-28 px-1 py-1">
                            <AmountInput
                              ariaLabel="Per night"
                              value={hotel.perNight}
                              onChange={(v) => setHotel({ perNight: v ?? 0 })}
                            />
                          </td>
                          <td className="w-28 px-1 py-1">
                            <AmountInput
                              ariaLabel="Extra bed"
                              nullable
                              value={hotel.extraBed}
                              onChange={(v) => setHotel({ extraBed: v })}
                            />
                          </td>
                          <td className="w-28 px-1 py-1">
                            <AmountInput
                              ariaLabel="CNB (6–12 yrs)"
                              nullable
                              value={hotel.childNoBed}
                              onChange={(v) => setHotel({ childNoBed: v })}
                            />
                          </td>
                          <td className="w-28 px-1 py-1">
                            <AmountInput
                              ariaLabel="Family room"
                              nullable
                              value={hotel.familyRoom}
                              onChange={(v) => setHotel({ familyRoom: v })}
                            />
                          </td>
                          <td className="py-1 pl-1">
                            <RowActions
                              index={i}
                              count={tier.hotels.length}
                              label="hotel"
                              onMove={(d) => onChange({ ...tier, hotels: moveItem(tier.hotels, i, d) })}
                              onDelete={() => onChange({ ...tier, hotels: tier.hotels.filter((_, j) => j !== i) })}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <AddRowButton
              onClick={() =>
                onChange({
                  ...tier,
                  hotels: [
                    ...tier.hotels,
                    {
                      location: tier.hotels.at(-1)?.location ?? "",
                      name: "",
                      perNight: 0,
                      extraBed: tier.hotels.at(-1)?.extraBed ?? null,
                      childNoBed: tier.hotels.at(-1)?.childNoBed ?? null,
                      familyRoom: null,
                    },
                  ],
                })
              }
            >
              Add hotel
            </AddRowButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
