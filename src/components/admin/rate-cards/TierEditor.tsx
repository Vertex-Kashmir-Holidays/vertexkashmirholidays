"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PACKAGE_COLUMNS,
  formatInr,
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
  warningCount,
  open,
  onToggle,
  onChange,
  onMove,
  onDelete,
}: Props) {
  const setPackage = (row: "b2b" | "customer", key: keyof PackageSet, value: number) =>
    onChange({ ...tier, packages: { ...tier.packages, [row]: { ...tier.packages[row], [key]: value } } });
  const setCost = (key: keyof PackageSet, value: number) =>
    onChange({ ...tier, cost: { ...tier.cost, [key]: value } });

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

          {/* Package prices + internal cost/profit */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
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
                {(["b2b", "customer"] as const).map((row) => (
                  <tr key={row}>
                    <td className="py-1 pr-2 font-semibold text-foreground">{row === "b2b" ? "B2B" : "Customer"}</td>
                    {PACKAGE_COLUMNS.map((c) => (
                      <td key={c.key} className="px-1 py-1">
                        <AmountInput
                          ariaLabel={`${row} ${c.label}`}
                          value={tier.packages[row][c.key]}
                          onChange={(v) => setPackage(row, c.key, v ?? 0)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-dashed border-border">
                  <td className="py-1 pr-2 text-foreground">
                    <span className="font-semibold">Cost</span>
                    <span className="ml-1.5 text-[11px] text-muted-foreground">internal</span>
                  </td>
                  {PACKAGE_COLUMNS.map((c) => (
                    <td key={c.key} className="px-1 py-1">
                      <AmountInput
                        ariaLabel={`cost ${c.label}`}
                        value={tier.cost[c.key] || null}
                        nullable
                        onChange={(v) => setCost(c.key, v ?? 0)}
                      />
                    </td>
                  ))}
                </tr>
                {(["b2b", "customer"] as const).map((row) => (
                  <tr key={`profit-${row}`} className="text-[12px]">
                    <td className="py-1 pr-2 text-muted-foreground">
                      {row === "b2b" ? "B2B" : "Customer"} profit
                      <span className="ml-1">(min {formatInr(minProfit[row])})</span>
                    </td>
                    {PACKAGE_COLUMNS.map((c) => {
                      const cost = tier.cost[c.key];
                      const profit = tier.packages[row][c.key] - cost;
                      const low = cost > 0 && profit < minProfit[row];
                      return (
                        <td
                          key={c.key}
                          className={cn(
                            "px-3 py-1 text-right tabular-nums",
                            cost === 0 ? "text-muted-foreground" : low ? "font-bold text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-300",
                          )}
                        >
                          {cost === 0 ? "—" : formatInr(profit)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
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
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="text-[12px] text-muted-foreground">
                      <th className="py-1.5 pr-1 text-left font-semibold">Location</th>
                      <th className="px-1 py-1.5 text-left font-semibold">Hotel</th>
                      <th className="px-1 py-1.5 text-right font-semibold">Per night</th>
                      <th className="px-1 py-1.5 text-right font-semibold">Extra bed</th>
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
