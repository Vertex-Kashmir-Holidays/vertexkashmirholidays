"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2, Mail, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/atoms/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/organisms/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/organisms/select";
import {
  HOTEL_DESTINATIONS,
  HOTEL_CATEGORIES,
  HOTEL_CATEGORY_LABELS,
  CATEGORY_SORT_ORDER,
  MEAL_PLAN_LEGEND,
  computeCategoryFromMap,
  rateNeedsRefresh,
  parseServices,
  type HotelCategoryValue,
  type HotelData,
  type HotelRate,
} from "@/lib/hotelSuppliers/schema";
import { InlineCell } from "./InlineCell";
import { EditRateRow } from "./EditRateRow";
import { EditServicesRow } from "./EditServicesRow";
import { NameCell } from "./NameCell";
import { RequestRatesDialog } from "./RequestRatesDialog";

export interface HotelSupplierRecord {
  id: string;
  hotelName: string;
  destination: string;
  category: HotelCategoryValue;
  isActive: boolean;
  data: HotelData;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initialHotels: HotelSupplierRecord[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const CATEGORY_OPTIONS = HOTEL_CATEGORIES.map((c) => ({ value: c, label: HOTEL_CATEGORY_LABELS[c] }));
const EMPTY_RATE: HotelRate = {
  validTo: null,
  mealPlans: { EP: null, CP: null, MAP: null, AP: null },
  extraBed: null,
};
// Columns before the rate columns: Sr, Name, Phone, Email, Category, Rating.
const HOTEL_COLS_BEFORE_RATES = 6;

function fmtMoney(n: number | null): string {
  return n == null ? "—" : `₹${n.toLocaleString("en-IN")}`;
}

function parseMoneyInput(v: string): number | null | "invalid" {
  if (v.trim() === "") return null;
  const n = Number(v);
  if (Number.isNaN(n) || n < 0) return "invalid";
  return n;
}

export function HotelSuppliersClient({ initialHotels, canCreate, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<string>(HOTEL_DESTINATIONS[0]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | HotelCategoryValue>("ALL");
  const [editingRateFor, setEditingRateFor] = useState<string | null>(null);
  const [editingServicesFor, setEditingServicesFor] = useState<string | null>(null);
  const [confirmDeleteHotel, setConfirmDeleteHotel] = useState<string | null>(null);
  const [requestRatesFor, setRequestRatesFor] = useState<HotelSupplierRecord | null>(null);

  function patchHotel(id: string, payload: Record<string, unknown>): Promise<boolean> {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          const res = await fetch(`/api/hotel-suppliers/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            if (res.status === 403) {
              toast.error("You don't have permission to edit hotel rates.");
            } else {
              const err = (await res.json().catch(() => null)) as { error?: string } | null;
              toast.error(typeof err?.error === "string" ? err.error : "Save failed.");
            }
            resolve(false);
            return;
          }
          toast.success("Saved.");
          router.refresh();
          resolve(true);
        } catch {
          toast.error("An error occurred.");
          resolve(false);
        }
      });
    });
  }

  function deleteHotel(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/hotel-suppliers/${id}`, { method: "DELETE" });
        if (res.status === 403) {
          toast.error("You don't have permission to delete hotel rates.");
          return;
        }
        if (!res.ok) throw new Error();
        toast.success("Hotel deleted.");
        router.refresh();
      } catch {
        toast.error("Failed to delete hotel.");
      } finally {
        setConfirmDeleteHotel(null);
      }
    });
  }

  const rows = useMemo(() => {
    return initialHotels
      .filter((h) => {
        if (h.destination !== activeTab) return false;
        if (categoryFilter !== "ALL" && h.category !== categoryFilter) return false;
        if (search && !h.hotelName.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const catDiff = CATEGORY_SORT_ORDER[a.category] - CATEGORY_SORT_ORDER[b.category];
        return catDiff !== 0 ? catDiff : a.hotelName.localeCompare(b.hotelName);
      });
  }, [initialHotels, activeTab, categoryFilter, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Hotel Rates</h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            Curated hotel options and exact supplier EP/CP/MAP/AP net rates for itinerary and quotation prep.
          </p>
        </div>
        {canCreate && (
          <Link
            href={`/admin/hotel-suppliers/new?destination=${encodeURIComponent(activeTab)}`}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-primary/25 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Hotel
          </Link>
        )}
      </div>

      {/* Meal plan legend */}
      <div className="bg-card rounded-2xl border border-border shadow-sm px-4 py-3">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
          Meal Plan Codes
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {MEAL_PLAN_LEGEND.map((l) => (
            <p key={l.code} className="text-xs text-muted-foreground">
              <strong className="text-foreground font-bold">{l.code}</strong>{" "}
              <span className="text-muted-foreground/70">→</span> {l.meaning}
            </p>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap gap-2 border-none px-0">
          {HOTEL_DESTINATIONS.map((d) => {
            const count = initialHotels.filter((h) => h.destination === d).length;
            return (
              <TabsTrigger
                key={d}
                value={d}
                className={cn(
                  "rounded-xl border px-4 py-2 text-[13px] font-bold whitespace-nowrap transition-colors",
                  "border-border text-muted-foreground hover:text-foreground hover:border-primary/40",
                  "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary data-[state=active]:shadow-sm data-[state=active]:shadow-primary/25",
                )}
              >
                {d}
                <span className="ml-1.5 font-normal opacity-80">({count})</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hotel..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-muted/50"
            />
          </div>

          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {CATEGORY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-xs text-muted-foreground shrink-0 ml-auto">
            {rows.length} hotel{rows.length === 1 ? "" : "s"} in {activeTab}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-t border-b border-border">
                {[
                  "Sr.",
                  "Name",
                  "Phone",
                  "Email",
                  "Category",
                  "Rating",
                  "EP",
                  "CP",
                  "MAP",
                  "AP",
                  "Extra Bed",
                  "Valid Till",
                  "Services",
                  "Actions",
                ].map((h, i) => (
                  <th
                    key={h}
                    className={cn(
                      "text-left px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap",
                      i === 1 && "sticky left-0 bg-muted z-10",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No hotels match the current filters for {activeTab}.
                  </td>
                </tr>
              ) : (
                rows.map((hotel, idx) => (
                  <Fragment key={hotel.id}>
                    <HotelRow
                      sr={idx + 1}
                      hotel={hotel}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      patchHotel={patchHotel}
                      confirmDeleteHotel={confirmDeleteHotel}
                      setConfirmDeleteHotel={setConfirmDeleteHotel}
                      onDeleteHotel={deleteHotel}
                      onEditRateClick={() => setEditingRateFor(hotel.id)}
                      onRequestRatesClick={() => setRequestRatesFor(hotel)}
                      onEditServicesClick={() => setEditingServicesFor(hotel.id)}
                    />
                    {editingRateFor === hotel.id && (
                      <EditRateRow
                        colSpanBefore={HOTEL_COLS_BEFORE_RATES}
                        initialRate={hotel.data.rate}
                        onCancel={() => setEditingRateFor(null)}
                        onSave={async (rate) => {
                          const category = computeCategoryFromMap(rate.mealPlans.MAP);
                          const ok = await patchHotel(hotel.id, {
                            category,
                            data: { ...hotel.data, rate },
                          });
                          if (ok) setEditingRateFor(null);
                          return ok;
                        }}
                      />
                    )}
                    {editingServicesFor === hotel.id && (
                      <EditServicesRow
                        colSpanBefore={13}
                        initialServices={hotel.data.property.services}
                        onCancel={() => setEditingServicesFor(null)}
                        onSave={async (services) => {
                          const ok = await patchHotel(hotel.id, {
                            data: {
                              ...hotel.data,
                              property: { ...hotel.data.property, services: services || null },
                            },
                          });
                          if (ok) setEditingServicesFor(null);
                          return ok;
                        }}
                      />
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {requestRatesFor && (
        <RequestRatesDialog
          hotelId={requestRatesFor.id}
          hotelName={requestRatesFor.hotelName}
          defaultEmail={requestRatesFor.data.property.email ?? ""}
          open={!!requestRatesFor}
          onOpenChange={(open) => {
            if (!open) setRequestRatesFor(null);
          }}
        />
      )}
    </div>
  );
}

interface HotelRowProps {
  sr: number;
  hotel: HotelSupplierRecord;
  canEdit: boolean;
  canDelete: boolean;
  patchHotel: (id: string, payload: Record<string, unknown>) => Promise<boolean>;
  confirmDeleteHotel: string | null;
  setConfirmDeleteHotel: (id: string | null) => void;
  onDeleteHotel: (id: string) => void;
  onEditRateClick: () => void;
  onRequestRatesClick: () => void;
  onEditServicesClick: () => void;
}

function HotelRow({
  sr,
  hotel,
  canEdit,
  canDelete,
  patchHotel,
  confirmDeleteHotel,
  setConfirmDeleteHotel,
  onDeleteHotel,
  onEditRateClick,
  onRequestRatesClick,
  onEditServicesClick,
}: HotelRowProps) {
  const rate = hotel.data.rate ?? EMPTY_RATE;
  const needsRateRequest = rateNeedsRefresh(hotel.data.rate);
  const hasEmail = !!hotel.data.property.email;

  function saveProperty(field: keyof HotelData["property"], value: string) {
    return patchHotel(hotel.id, {
      data: { ...hotel.data, property: { ...hotel.data.property, [field]: value || null } },
    });
  }

  function saveRateField(updater: (r: HotelRate) => HotelRate, recomputeCategory = false) {
    const nextRate = updater(rate);
    const payload: Record<string, unknown> = { data: { ...hotel.data, rate: nextRate } };
    if (recomputeCategory) payload.category = computeCategoryFromMap(nextRate.mealPlans.MAP);
    return patchHotel(hotel.id, payload);
  }

  function moneyCell(value: number | null, onSave: (v: string) => Promise<boolean>) {
    return (
      <InlineCell
        canEdit={canEdit}
        type="number"
        align="right"
        value={value != null ? String(value) : ""}
        displayValue={fmtMoney(value)}
        onSave={onSave}
        className="min-w-[90px]"
      />
    );
  }

  function saveMoney(field: "EP" | "CP" | "MAP" | "AP", v: string) {
    const parsed = parseMoneyInput(v);
    if (parsed === "invalid") {
      toast.error("Enter a valid non-negative number.");
      return Promise.resolve(false);
    }
    return saveRateField((r) => ({ ...r, mealPlans: { ...r.mealPlans, [field]: parsed } }), field === "MAP");
  }

  return (
    <tr className="hover:bg-muted/50 transition-colors">
      <td className="px-3 py-2.5 text-xs text-muted-foreground">{sr}</td>
      <td className="sticky left-0 bg-card">
        <NameCell
          canEdit={canEdit}
          hotelName={hotel.hotelName}
          mapUrl={hotel.data.property.mapUrl}
          onSave={({ hotelName, mapUrl }) =>
            patchHotel(hotel.id, {
              hotelName,
              data: { ...hotel.data, property: { ...hotel.data.property, mapUrl: mapUrl || null } },
            })
          }
          className="font-semibold text-foreground"
        />
      </td>
      <td>
        <InlineCell
          canEdit={canEdit}
          value={hotel.data.property.phone ?? ""}
          onSave={(v) => saveProperty("phone", v)}
          className="min-w-[130px] whitespace-nowrap"
        />
      </td>
      <td>
        <InlineCell
          canEdit={canEdit}
          value={hotel.data.property.email ?? ""}
          onSave={(v) => saveProperty("email", v)}
          className="min-w-[160px]"
        />
      </td>
      <td className="px-3 py-2.5" title="Auto-set from MAP net rate">
        <Badge>{HOTEL_CATEGORY_LABELS[hotel.category]}</Badge>
      </td>
      <td>
        <InlineCell
          canEdit={canEdit}
          value={hotel.data.rating ?? ""}
          onSave={(v) => patchHotel(hotel.id, { data: { ...hotel.data, rating: v || null } })}
          className="min-w-[130px]"
        />
      </td>
      <td>{moneyCell(rate.mealPlans.EP, (v) => saveMoney("EP", v))}</td>
      <td>{moneyCell(rate.mealPlans.CP, (v) => saveMoney("CP", v))}</td>
      <td>{moneyCell(rate.mealPlans.MAP, (v) => saveMoney("MAP", v))}</td>
      <td>{moneyCell(rate.mealPlans.AP, (v) => saveMoney("AP", v))}</td>
      <td>
        <InlineCell
          canEdit={canEdit}
          type="number"
          align="right"
          value={rate.extraBed != null ? String(rate.extraBed) : ""}
          displayValue={fmtMoney(rate.extraBed)}
          onSave={(v) => {
            const parsed = parseMoneyInput(v);
            if (parsed === "invalid") {
              toast.error("Enter a valid non-negative number.");
              return Promise.resolve(false);
            }
            return saveRateField((r) => ({ ...r, extraBed: parsed }));
          }}
          className="min-w-[100px]"
        />
      </td>
      <td>
        <InlineCell
          canEdit={canEdit}
          type="date"
          value={rate.validTo ?? ""}
          onSave={(v) => saveRateField((r) => ({ ...r, validTo: v || null }))}
          className="min-w-[110px]"
        />
      </td>
      <td className="px-3 py-2.5 min-w-[180px] max-w-[260px]">
        {(() => {
          const services = parseServices(hotel.data.property.services);
          if (services.length === 0) {
            return <span className="text-muted-foreground/50 text-sm">—</span>;
          }
          return (
            <ul className="space-y-0.5 text-xs text-foreground/80">
              {services.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-primary shrink-0">•</span>
                  {s}
                </li>
              ))}
            </ul>
          );
        })()}
      </td>
      <td className="px-3 py-2.5">
        {!canEdit && !canDelete ? (
          <span className="text-[11px] text-muted-foreground italic">View only</span>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            {canEdit && (
              <button
                type="button"
                onClick={onEditRateClick}
                title={hotel.data.rate ? "Edit rate" : "Add rate"}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
              >
                {hotel.data.rate ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={onEditServicesClick}
                title="Edit services"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
              >
                <ListChecks className="w-3.5 h-3.5" />
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={onRequestRatesClick}
                disabled={!needsRateRequest || !hasEmail}
                title={
                  !hasEmail
                    ? "No email on file for this hotel"
                    : needsRateRequest
                      ? "Send a B2B rate request email"
                      : "MAP rate is current — no request needed"
                }
                className="w-7 h-7 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:pointer-events-none disabled:text-muted-foreground"
              >
                <Mail className="w-3.5 h-3.5" />
              </button>
            )}
            {canDelete &&
              (confirmDeleteHotel === hotel.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDeleteHotel(hotel.id)}
                    className="text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDeleteHotel(null)}
                    className="text-[11px] font-bold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg border border-border"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteHotel(hotel.id)}
                  title="Delete hotel"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ))}
          </div>
        )}
      </td>
    </tr>
  );
}
