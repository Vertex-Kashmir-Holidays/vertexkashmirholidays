"use client";

import { useState } from "react";
import { BedDouble, Check, Mail, Pencil, Star } from "lucide-react";
import { Badge } from "@/components/ui/atoms/badge";
import { cn } from "@/lib/utils";
import {
  HOTEL_CATEGORY_LABELS,
  getDeluxeMapRate,
  rateNeedsRefresh,
  type HotelData,
} from "@/lib/hotelSuppliers/schema";
import type { HotelSupplierRecord } from "./HotelSuppliersClient";
import { InlineCell } from "./InlineCell";
import { NameCell } from "./NameCell";
import { EditHotelModal } from "./EditHotelModal";
import { RequestRatesDialog } from "./RequestRatesDialog";
import { useHotelPatch } from "./useHotelPatch";
import { DeleteHotelDialog } from "./DeleteHotelDialog";

const fmtMoney = (n: number | null) => (n == null ? "—" : `₹${n.toLocaleString("en-IN")}`);
const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

/**
 * The hotel's own page header — every field the Hotel Rates table shows, edited
 * the same way (double-click inline fields, the Edit hotel dialog for the rest
 * incl. room rates, and Request rates), so the page can replace the table's
 * inline expand later without losing anything.
 */
export function HotelProfilePanel({
  hotel,
  canEdit,
  canDelete,
  linkedStays,
}: {
  hotel: HotelSupplierRecord;
  canEdit: boolean;
  canDelete: boolean;
  /** Booking stays linked to this hotel, for the delete warning (null = unknown). */
  linkedStays: number | null;
}) {
  const patchHotel = useHotelPatch();
  const [editing, setEditing] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const needsRateRequest = rateNeedsRefresh(hotel.data.rate);
  const hasEmail = !!hotel.data.property.email;

  function saveProperty(field: keyof HotelData["property"], value: string) {
    return patchHotel(hotel.id, {
      data: { ...hotel.data, property: { ...hotel.data.property, [field]: value || null } },
    });
  }

  const field = (label: string, node: React.ReactNode, hint?: string) => (
    <div className="min-w-0 rounded-xl border border-border/60 bg-muted/20" title={hint}>
      <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {/* InlineCell brings its own px-3 py-2.5; plain values match it. */}
      {node}
    </div>
  );
  const plain = (v: React.ReactNode) => (
    <div className="px-3 py-2.5 text-sm text-foreground">{v}</div>
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <BedDouble className="h-5 w-5 shrink-0 text-primary" />
          <NameCell
            canEdit={canEdit}
            hotelName={hotel.hotelName}
            mapUrl={hotel.data.property.mapUrl}
            onSave={({ hotelName, mapUrl }) =>
              patchHotel(hotel.id, {
                hotelName,
                data: {
                  ...hotel.data,
                  property: { ...hotel.data.property, mapUrl: mapUrl || null },
                },
              })
            }
            className="font-display text-xl font-extrabold text-foreground"
          />
          {hotel.recommended && (
            <Star className="h-4 w-4 shrink-0 text-amber-400" fill="currentColor" strokeWidth={0} />
          )}
          {!hotel.isActive && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              Inactive
            </span>
          )}
        </div>
        {(canEdit || canDelete) && (
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setRequesting(true)}
                  disabled={!needsRateRequest || !hasEmail}
                  title={
                    !hasEmail
                      ? "No email on file for this hotel"
                      : needsRateRequest
                        ? "Send a B2B rate request email"
                        : "MAP rate is current — no request needed"
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 disabled:pointer-events-none disabled:opacity-40"
                >
                  <Mail className="h-3.5 w-3.5" /> Request rates
                </button>
              </>
            )}
            {canDelete && (
              <DeleteHotelDialog
                hotelId={hotel.id}
                hotelName={hotel.hotelName}
                linkedStays={linkedStays}
              />
            )}
          </div>
        )}
      </div>
      <p className="mt-1 pl-7 text-xs text-muted-foreground">{hotel.destination}</p>

      <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
        {field(
          "Phone",
          <InlineCell
            canEdit={canEdit}
            value={hotel.data.property.phone ?? ""}
            onSave={(v) => saveProperty("phone", v)}
          />,
        )}
        {field(
          "Email",
          <InlineCell
            canEdit={canEdit}
            value={hotel.data.property.email ?? ""}
            onSave={(v) => saveProperty("email", v)}
            className="break-all"
          />,
        )}
        {field(
          "Rating",
          <InlineCell
            canEdit={canEdit}
            value={hotel.data.rating ?? ""}
            onSave={(v) => patchHotel(hotel.id, { data: { ...hotel.data, rating: v || null } })}
          />,
        )}
        {field(
          "Category",
          plain(<Badge>{HOTEL_CATEGORY_LABELS[hotel.category]}</Badge>),
          "Auto-set from the cheapest room's MAP rate",
        )}
        {field(
          "Family Room",
          <div className="px-3 py-2.5">
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => patchHotel(hotel.id, { hasFamilyRoom: !hotel.hasFamilyRoom })}
              title={canEdit ? "Click to toggle" : undefined}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                hotel.hasFamilyRoom
                  ? "bg-sky-500/10 text-sky-700 dark:text-sky-300"
                  : "bg-muted text-muted-foreground",
                canEdit ? "cursor-pointer hover:ring-1 hover:ring-border" : "cursor-default",
              )}
            >
              {hotel.hasFamilyRoom ? "Yes" : "No"}
            </button>
          </div>,
        )}
        {field("Recommended", plain(hotel.recommended ? "Yes" : "No"), "Change via Edit hotel")}
        {field(
          "MAP (Deluxe)",
          plain(fmtMoney(getDeluxeMapRate(hotel.data.rate))),
          "MAP rate for the Deluxe room type",
        )}
        {field("Rates valid till", plain(fmtDate(hotel.data.rate?.validTo ?? null)))}
        {field(
          "Rate request",
          plain(
            hotel.lastRateRequestSentAt ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" /> Sent {fmtDate(hotel.lastRateRequestSentAt)}
              </span>
            ) : (
              <span className="text-muted-foreground">Not sent</span>
            ),
          ),
        )}
        {field(
          "Bookings given",
          plain(`${hotel.confirmedStays} confirmed`),
          "Counted automatically from booking stays linked to this hotel and marked Confirmed",
        )}
        {field(
          "Website",
          plain(hotel.showOnWebsite ? "Shown on website" : "Hidden"),
          "Change via Edit hotel",
        )}
      </div>

      {editing && (
        <EditHotelModal
          hotel={hotel}
          open={editing}
          onOpenChange={(o) => !o && setEditing(false)}
          onSave={(payload) => patchHotel(hotel.id, payload)}
        />
      )}
      {requesting && (
        <RequestRatesDialog
          hotelId={hotel.id}
          hotelName={hotel.hotelName}
          defaultEmail={hotel.data.property.email ?? ""}
          open={requesting}
          onOpenChange={(o) => !o && setRequesting(false)}
        />
      )}
    </div>
  );
}
