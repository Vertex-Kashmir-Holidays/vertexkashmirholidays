"use client";

import { Fragment, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2, Mail, Star, ChevronDown, ChevronUp, Check, SlidersHorizontal } from "lucide-react";
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
  getMinMapRate,
  parseRatingValue,
  rateNeedsRefresh,
  type HotelCategoryValue,
  type HotelData,
} from "@/lib/hotelSuppliers/schema";
import { InlineCell } from "./InlineCell";
import { NameCell } from "./NameCell";
import { RequestRatesDialog } from "./RequestRatesDialog";
import { EditHotelModal } from "./EditHotelModal";
import { HotelDetailsRow } from "./HotelDetailsRow";

export interface HotelSupplierRecord {
  id: string;
  hotelName: string;
  destination: string;
  category: HotelCategoryValue;
  isActive: boolean;
  recommended: boolean;
  lastRateRequestSentAt: string | null;
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

type TriState = "ALL" | "YES" | "NO";
type SortMode = "category" | "price-asc" | "rating-desc";
type PageSize = 20 | 50 | 100 | 200 | "ALL";

const PAGE_SIZE_OPTIONS: { value: PageSize; label: string }[] = [
  { value: 20, label: "20 / page" },
  { value: 50, label: "50 / page" },
  { value: 100, label: "100 / page" },
  { value: 200, label: "200 / page" },
  { value: "ALL", label: "All" },
];

const CATEGORY_OPTIONS = HOTEL_CATEGORIES.map((c) => ({ value: c, label: HOTEL_CATEGORY_LABELS[c] }));
// Columns before Actions: Sr, Name, Phone, Email, Category, Recommended,
// Rating, Valid Till, Sent — kept as one constant so the expand-row colSpan
// can't silently drift from the header count. Location and per-room MAP
// rates live in the expanded row only, not the main table.
const HOTEL_COL_COUNT = 10;

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function HotelSuppliersClient({ initialHotels, canCreate, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<string>(HOTEL_DESTINATIONS[0]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | HotelCategoryValue>("ALL");
  const [recommendedFilter, setRecommendedFilter] = useState<TriState>("ALL");
  const [sentFilter, setSentFilter] = useState<TriState>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("category");
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [page, setPage] = useState(1);
  const [editingHotel, setEditingHotel] = useState<HotelSupplierRecord | null>(null);
  const [expandedFor, setExpandedFor] = useState<string | null>(null);
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
    const filtered = initialHotels.filter((h) => {
      if (h.destination !== activeTab) return false;
      if (categoryFilter !== "ALL" && h.category !== categoryFilter) return false;
      if (recommendedFilter !== "ALL" && h.recommended !== (recommendedFilter === "YES")) return false;
      if (sentFilter !== "ALL" && !!h.lastRateRequestSentAt !== (sentFilter === "YES")) return false;
      if (search && !h.hotelName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    if (sortMode === "price-asc") {
      return filtered.sort((a, b) => {
        const pa = getMinMapRate(a.data.rate);
        const pb = getMinMapRate(b.data.rate);
        if (pa == null && pb == null) return a.hotelName.localeCompare(b.hotelName);
        if (pa == null) return 1;
        if (pb == null) return -1;
        return pa - pb;
      });
    }
    if (sortMode === "rating-desc") {
      return filtered.sort((a, b) => {
        const ra = parseRatingValue(a.data.rating);
        const rb = parseRatingValue(b.data.rating);
        if (ra == null && rb == null) return a.hotelName.localeCompare(b.hotelName);
        if (ra == null) return 1;
        if (rb == null) return -1;
        return rb - ra;
      });
    }
    return filtered.sort((a, b) => {
      const catDiff = CATEGORY_SORT_ORDER[a.category] - CATEGORY_SORT_ORDER[b.category];
      return catDiff !== 0 ? catDiff : a.hotelName.localeCompare(b.hotelName);
    });
  }, [initialHotels, activeTab, categoryFilter, recommendedFilter, sentFilter, sortMode, search]);

  const totalPages = pageSize === "ALL" ? 1 : Math.max(1, Math.ceil(rows.length / pageSize));

  // Filters/sort/page-size changes reshuffle `rows`, so the current page can
  // land past the new last page (or just be stale) — snap back to page 1.
  useEffect(() => {
    setPage(1);
  }, [rows, pageSize]);

  const pageStart = pageSize === "ALL" ? 0 : (page - 1) * pageSize;
  const pagedRows = pageSize === "ALL" ? rows : rows.slice(pageStart, pageStart + pageSize);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Hotel Rates</h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            Curated hotel options and exact supplier EP/CP/MAP net rates for itinerary and quotation prep.
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

          <Select value={recommendedFilter} onValueChange={(v) => setRecommendedFilter(v as TriState)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Recommended" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All hotels</SelectItem>
              <SelectItem value="YES">Recommended</SelectItem>
              <SelectItem value="NO">Not recommended</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sentFilter} onValueChange={(v) => setSentFilter(v as TriState)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Rate request" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Sent or not</SelectItem>
              <SelectItem value="YES">Request sent</SelectItem>
              <SelectItem value="NO">Never sent</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="category">Sort: Category</SelectItem>
              <SelectItem value="price-asc">Sort: Price (Low → High)</SelectItem>
              <SelectItem value="rating-desc">Sort: Rating (High → Low)</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(v === "ALL" ? "ALL" : (Number(v) as PageSize))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>
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
                  "Rec.",
                  "Rating",
                  "Valid Till",
                  "Sent",
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
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={HOTEL_COL_COUNT} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No hotels match the current filters for {activeTab}.
                  </td>
                </tr>
              ) : (
                pagedRows.map((hotel, idx) => (
                  <Fragment key={hotel.id}>
                    <HotelRow
                      sr={pageStart + idx + 1}
                      hotel={hotel}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      patchHotel={patchHotel}
                      confirmDeleteHotel={confirmDeleteHotel}
                      setConfirmDeleteHotel={setConfirmDeleteHotel}
                      onDeleteHotel={deleteHotel}
                      onEditClick={() => setEditingHotel(hotel)}
                      onRequestRatesClick={() => setRequestRatesFor(hotel)}
                      expanded={expandedFor === hotel.id}
                      onToggleExpand={() => setExpandedFor(expandedFor === hotel.id ? null : hotel.id)}
                    />
                    {expandedFor === hotel.id && (
                      <HotelDetailsRow
                        colSpan={HOTEL_COL_COUNT}
                        data={hotel.data}
                        recommended={hotel.recommended}
                      />
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pageSize !== "ALL" && rows.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {pageStart + 1}–{Math.min(pageStart + pageSize, rows.length)} of {rows.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="text-xs font-bold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                Previous
              </button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="text-xs font-bold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
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

      {editingHotel && (
        <EditHotelModal
          hotel={editingHotel}
          open={!!editingHotel}
          onOpenChange={(open) => {
            if (!open) setEditingHotel(null);
          }}
          onSave={(payload) => patchHotel(editingHotel.id, payload)}
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
  onEditClick: () => void;
  onRequestRatesClick: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
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
  onEditClick,
  onRequestRatesClick,
  expanded,
  onToggleExpand,
}: HotelRowProps) {
  const needsRateRequest = rateNeedsRefresh(hotel.data.rate);
  const hasEmail = !!hotel.data.property.email;

  function saveProperty(field: keyof HotelData["property"], value: string) {
    return patchHotel(hotel.id, {
      data: { ...hotel.data, property: { ...hotel.data.property, [field]: value || null } },
    });
  }

  return (
    <tr
      onClick={onToggleExpand}
      className={cn(
        "cursor-pointer hover:bg-muted/50 transition-colors",
        hotel.recommended && "bg-emerald-500/[0.06] hover:bg-emerald-500/10",
      )}
    >
      <td className="px-3 py-2.5 text-xs text-muted-foreground">{sr}</td>
      <td
        className={cn("sticky left-0 bg-card", hotel.recommended && "bg-emerald-50 dark:bg-emerald-950/40")}
        onClick={(e) => e.stopPropagation()}
      >
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
      <td onClick={(e) => e.stopPropagation()}>
        <InlineCell
          canEdit={canEdit}
          value={hotel.data.property.phone ?? ""}
          onSave={(v) => saveProperty("phone", v)}
          className="min-w-[130px] whitespace-nowrap"
        />
      </td>
      <td onClick={(e) => e.stopPropagation()}>
        <InlineCell
          canEdit={canEdit}
          value={hotel.data.property.email ?? ""}
          onSave={(v) => saveProperty("email", v)}
          className="min-w-[160px]"
        />
      </td>
      <td className="px-3 py-2.5" title="Auto-set from the cheapest room's MAP rate">
        <Badge>{HOTEL_CATEGORY_LABELS[hotel.category]}</Badge>
      </td>
      <td className="px-3 py-2.5">
        {hotel.recommended ? (
          <Star className="w-4 h-4 text-amber-400" fill="currentColor" strokeWidth={0} />
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </td>
      <td onClick={(e) => e.stopPropagation()}>
        <InlineCell
          canEdit={canEdit}
          value={hotel.data.rating ?? ""}
          onSave={(v) => patchHotel(hotel.id, { data: { ...hotel.data, rating: v || null } })}
          className="min-w-[130px]"
        />
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{fmtDate(hotel.data.rate?.validTo ?? null)}</td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        {hotel.lastRateRequestSentAt ? (
          <span className="flex items-center gap-1 text-[12px] text-emerald-600 dark:text-emerald-400">
            <Check className="w-3.5 h-3.5" /> {fmtDate(hotel.lastRateRequestSentAt)}
          </span>
        ) : (
          <span className="text-[12px] text-muted-foreground/50">Not sent</span>
        )}
      </td>
      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
        {!canEdit && !canDelete ? (
          <span className="text-[11px] text-muted-foreground italic">View only</span>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={onToggleExpand}
              title={expanded ? "Hide details" : "View more"}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={onEditClick}
                title="Edit hotel"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
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
                <div className="col-span-2 flex items-center gap-1">
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
