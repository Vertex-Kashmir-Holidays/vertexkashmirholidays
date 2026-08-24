"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
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
  computeCategoryFromMap,
  type HotelCategoryValue,
  type HotelData,
  type HotelRate,
} from "@/lib/hotelSuppliers/schema";
import { InlineCell } from "./InlineCell";
import { EditRateRow } from "./EditRateRow";
import { NameCell } from "./NameCell";

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
const EMPTY_RATE: HotelRate = { validTo: null, mealPlans: { CP: null, MAP: null, AP: null }, extraBed: null };
// Columns before the Actions cell: Sr, Name, Phone, Email, Category, Rating.
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
  const [confirmDeleteHotel, setConfirmDeleteHotel] = useState<string | null>(null);

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
            Curated hotel options and exact supplier MAP/CP net rates for itinerary and quotation prep.
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
                {["Sr.", "Name", "Phone", "Email", "Category", "Rating", "MAP", "CP", "Extra Bed", "Valid Till", "Actions"].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={cn(
                        "text-left px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap",
                        i === 1 && "sticky left-0 bg-muted z-10",
                      )}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground text-sm">
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
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
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
}: HotelRowProps) {
  const rate = hotel.data.rate ?? EMPTY_RATE;

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
      <td>
        <InlineCell
          canEdit={canEdit}
          type="number"
          align="right"
          value={rate.mealPlans.MAP != null ? String(rate.mealPlans.MAP) : ""}
          displayValue={fmtMoney(rate.mealPlans.MAP)}
          onSave={(v) => {
            const parsed = parseMoneyInput(v);
            if (parsed === "invalid") {
              toast.error("Enter a valid non-negative number.");
              return Promise.resolve(false);
            }
            return saveRateField((r) => ({ ...r, mealPlans: { ...r.mealPlans, MAP: parsed } }), true);
          }}
          className="min-w-[90px]"
        />
      </td>
      <td>
        <InlineCell
          canEdit={canEdit}
          type="number"
          align="right"
          value={rate.mealPlans.CP != null ? String(rate.mealPlans.CP) : ""}
          displayValue={fmtMoney(rate.mealPlans.CP)}
          onSave={(v) => {
            const parsed = parseMoneyInput(v);
            if (parsed === "invalid") {
              toast.error("Enter a valid non-negative number.");
              return Promise.resolve(false);
            }
            return saveRateField((r) => ({ ...r, mealPlans: { ...r.mealPlans, CP: parsed } }));
          }}
          className="min-w-[90px]"
        />
      </td>
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
