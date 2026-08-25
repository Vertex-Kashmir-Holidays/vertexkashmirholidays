"use client";

// Lightweight, ephemeral package-cost calculator — accessible from the CRM
// header on any admin page. No persistence (no DB table, no localStorage):
// state lives in this component only and resets on a full page reload.
// State survives client-side navigation between admin pages because this
// component is mounted once in AdminShell, which doesn't remount on route
// change — that's "accessible from any CRM page", not cross-session saving.
//
// Deliberately NOT profit/markup/margin/quotation/invoice/booking — those
// are explicitly out of scope until a future iteration. Hotel rows are
// manual text entry for now; the `name` field is where a future Hotel
// Suppliers & Rates picker would plug in (Hotel -> Room -> Meal Plan ->
// Supplier Rate), without changing this component's shape.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useDragControls } from "framer-motion";
import { Calculator, X, Plus, Trash2, GripHorizontal, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HotelRow {
  id: string;
  name: string;
  nights: string;
  cost: string;
}

interface CostRow {
  id: string;
  label: string;
  cost: string;
}

function toNumber(v: string): number {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function fmtINR(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function newId(): string {
  return crypto.randomUUID();
}

const inputCls =
  "w-full rounded-lg border border-border bg-card px-2 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition";

const MOC_MINIMUM = 2000;

const DEFAULT_HOTELS: HotelRow[] = [{ id: newId(), name: "", nights: "", cost: "" }];
const DEFAULT_OTHER_COSTS: CostRow[] = [
  { id: newId(), label: "Cab", cost: "" },
  { id: newId(), label: "Activity", cost: "" },
  { id: newId(), label: "Guide", cost: "" },
];

export function PackageCalculator() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [hotels, setHotels] = useState<HotelRow[]>(DEFAULT_HOTELS);
  const [otherCosts, setOtherCosts] = useState<CostRow[]>(DEFAULT_OTHER_COSTS);
  const [cabPerDayCost, setCabPerDayCost] = useState("");
  const [cabDays, setCabDays] = useState("");
  const [cabIncluded, setCabIncluded] = useState(false);
  const [moc, setMoc] = useState(String(MOC_MINIMUM));

  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const hotelsTotal = hotels.reduce((sum, h) => sum + toNumber(h.cost), 0);
  const otherCostsTotal = otherCosts.reduce((sum, c) => sum + toNumber(c.cost), 0);
  const cabPerDayTotal = toNumber(cabPerDayCost) * toNumber(cabDays);
  const mocValue = Math.max(MOC_MINIMUM, toNumber(moc));
  const grandTotal = hotelsTotal + otherCostsTotal + (cabIncluded ? cabPerDayTotal : 0) + mocValue;

  const cabRowHasCost = otherCosts.some(
    (c) => c.label.trim().toLowerCase() === "cab" && toNumber(c.cost) > 0,
  );
  const possibleDoubleCount = cabIncluded && cabRowHasCost;

  function addHotel() {
    setHotels((rows) => [...rows, { id: newId(), name: "", nights: "", cost: "" }]);
  }
  function removeHotel(id: string) {
    setHotels((rows) => rows.filter((r) => r.id !== id));
  }
  function updateHotel(id: string, field: keyof Omit<HotelRow, "id">, value: string) {
    setHotels((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function addCost() {
    setOtherCosts((rows) => [...rows, { id: newId(), label: "Additional", cost: "" }]);
  }
  function removeCost(id: string) {
    setOtherCosts((rows) => rows.filter((r) => r.id !== id));
  }
  function updateCost(id: string, field: keyof Omit<CostRow, "id">, value: string) {
    setOtherCosts((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Package Calculator"
        title="Package Calculator"
        className={cn(
          "text-muted-foreground hover:text-foreground transition-colors",
          open && "text-primary",
        )}
      >
        <Calculator className="w-5 h-5" />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div ref={constraintsRef} className="fixed inset-0 z-[9999] pointer-events-none">
            <motion.div
              drag
              dragControls={dragControls}
              dragListener={false}
              dragMomentum={false}
              dragConstraints={constraintsRef}
              dragElastic={0}
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-auto absolute top-16 right-4 sm:right-8 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border border-primary/30 bg-card shadow-[0_0_0_1.5px_hsl(var(--primary)/0.35),0_8px_16px_-4px_rgba(0,0,0,0.5),0_32px_64px_-12px_rgba(0,0,0,0.85)] flex flex-col max-h-[calc(100vh-6rem)]"
            >
              {/* Drag handle / header */}
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/50 rounded-t-2xl cursor-grab active:cursor-grabbing shrink-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <GripHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Calculator className="w-4 h-4 text-primary shrink-0" />
                  <p className="font-display font-bold text-foreground text-sm truncate">
                    Package Calculator
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close calculator"
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
                {/* Hotels */}
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                      Hotels
                    </h3>
                    <button
                      type="button"
                      onClick={addHotel}
                      className="flex items-center gap-1 text-[11px] font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Hotel
                    </button>
                  </div>
                  <div className="space-y-2">
                    {hotels.map((h) => (
                      <div key={h.id} className="flex items-center gap-1.5">
                        <input
                          value={h.name}
                          onChange={(e) => updateHotel(h.id, "name", e.target.value)}
                          placeholder="Hotel name"
                          className={cn(inputCls, "flex-[2] min-w-0")}
                        />
                        <input
                          type="number"
                          min={0}
                          value={h.nights}
                          onChange={(e) => updateHotel(h.id, "nights", e.target.value)}
                          placeholder="Nights"
                          className={cn(inputCls, "w-16 shrink-0 text-right")}
                        />
                        <input
                          type="number"
                          min={0}
                          value={h.cost}
                          onChange={(e) => updateHotel(h.id, "cost", e.target.value)}
                          placeholder="Cost"
                          className={cn(inputCls, "w-24 shrink-0 text-right")}
                        />
                        <button
                          type="button"
                          onClick={() => removeHotel(h.id)}
                          title="Remove hotel"
                          className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {hotels.length === 0 && (
                      <p className="text-[11px] text-muted-foreground italic">No hotels added.</p>
                    )}
                  </div>
                  <div className="flex justify-between text-[12px] font-semibold text-muted-foreground pt-1">
                    <span>Hotels subtotal</span>
                    <span className="text-foreground">{fmtINR(hotelsTotal)}</span>
                  </div>
                </section>

                {/* Other Costs */}
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                      Other Costs
                    </h3>
                    <button
                      type="button"
                      onClick={addCost}
                      className="flex items-center gap-1 text-[11px] font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Cost
                    </button>
                  </div>
                  <div className="space-y-2">
                    {otherCosts.map((c) => (
                      <div key={c.id} className="flex items-center gap-1.5">
                        <input
                          value={c.label}
                          onChange={(e) => updateCost(c.id, "label", e.target.value)}
                          placeholder="Label"
                          className={cn(inputCls, "flex-[2] min-w-0")}
                        />
                        <input
                          type="number"
                          min={0}
                          value={c.cost}
                          onChange={(e) => updateCost(c.id, "cost", e.target.value)}
                          placeholder="Cost"
                          className={cn(inputCls, "w-24 shrink-0 text-right")}
                        />
                        <button
                          type="button"
                          onClick={() => removeCost(c.id)}
                          title="Remove cost"
                          className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {otherCosts.length === 0 && (
                      <p className="text-[11px] text-muted-foreground italic">No other costs added.</p>
                    )}
                  </div>
                  <div className="flex justify-between text-[12px] font-semibold text-muted-foreground pt-1">
                    <span>Other costs subtotal</span>
                    <span className="text-foreground">{fmtINR(otherCostsTotal)}</span>
                  </div>
                </section>

                {/* Cab Per Day */}
                <section className="space-y-2">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                    Cab Per Day
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      value={cabPerDayCost}
                      onChange={(e) => setCabPerDayCost(e.target.value)}
                      placeholder="Cost / day"
                      className={cn(inputCls, "flex-1 min-w-0 text-right")}
                    />
                    <span className="text-muted-foreground text-xs shrink-0">×</span>
                    <input
                      type="number"
                      min={0}
                      value={cabDays}
                      onChange={(e) => setCabDays(e.target.value)}
                      placeholder="Days"
                      className={cn(inputCls, "w-16 shrink-0 text-right")}
                    />
                    <span className="text-muted-foreground text-xs shrink-0">=</span>
                    <span className="w-24 shrink-0 text-right text-[13px] font-bold text-foreground">
                      {fmtINR(cabPerDayTotal)}
                    </span>
                  </div>
                  <label className="flex items-center gap-2 text-[12px] text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={cabIncluded}
                      onChange={(e) => setCabIncluded(e.target.checked)}
                      className="rounded border-border accent-primary"
                    />
                    Include this in Total Cost
                    {cabIncluded && cabPerDayTotal > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        (+{fmtINR(cabPerDayTotal)})
                      </span>
                    )}
                  </label>
                  {possibleDoubleCount && (
                    <div className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg px-2 py-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        You also have a &quot;Cab&quot; cost under Other Costs — check you&apos;re not
                        counting cab twice.
                      </span>
                    </div>
                  )}
                </section>

                {/* MOC */}
                <section className="space-y-2">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">MOC</h3>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={MOC_MINIMUM}
                      value={moc}
                      onChange={(e) => setMoc(e.target.value)}
                      placeholder={String(MOC_MINIMUM)}
                      className={cn(inputCls, "flex-1 min-w-0 text-right")}
                    />
                    <span className="w-24 shrink-0 text-right text-[13px] font-bold text-foreground">
                      {fmtINR(mocValue)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Margin of Operational Cost — minimum {fmtINR(MOC_MINIMUM)}, always included in Total Cost.
                  </p>
                </section>
              </div>

              {/* Total — sticky footer */}
              <div className="shrink-0 border-t border-border px-4 py-3 bg-muted/40 rounded-b-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">Total Cost</span>
                  <span className="text-lg font-extrabold text-primary">{fmtINR(grandTotal)}</span>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body,
        )}
    </>
  );
}
