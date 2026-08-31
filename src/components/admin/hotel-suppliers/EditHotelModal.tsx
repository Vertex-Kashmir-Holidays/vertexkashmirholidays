"use client";

// Everything EXCEPT name/map-link/phone/email/rating/bookingsCount (those
// stay inline-editable in the table) is edited here: destination, location,
// contact person, the room-rate table, services, and the recommended/active
// flags. One Save
// = one PATCH with the full merged `data` blob, matching how every other
// write to this API already works (see [id]/route.ts's comment — the client
// always sends the complete `data` object, never a partial path-diff).
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/organisms/dialog";
import {
  HOTEL_DESTINATIONS,
  computeCategoryFromMap,
  getDeluxeMapRate,
  type HotelData,
  type HotelRate,
  type RoomRateRow,
} from "@/lib/hotelSuppliers/schema";
import { RoomRatesEditor, EMPTY_ROOM_RATE_ROW_DRAFT, type RoomRateRowDraft } from "./RoomRatesEditor";
import type { HotelSupplierRecord } from "./HotelSuppliersClient";

interface EditHotelModalProps {
  hotel: HotelSupplierRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: Record<string, unknown>) => Promise<boolean>;
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-card";
const labelCls = "block text-xs font-bold text-muted-foreground mb-1.5";

function roomToDraft(r: RoomRateRow): RoomRateRowDraft {
  return {
    roomType: r.roomType,
    ep: r.ep != null ? String(r.ep) : "",
    cp: r.cp != null ? String(r.cp) : "",
    map: r.map != null ? String(r.map) : "",
  };
}

function parseMoney(v: string): number | null | "invalid" {
  if (v.trim() === "") return null;
  const n = Number(v);
  if (Number.isNaN(n) || n < 0) return "invalid";
  return n;
}

export function EditHotelModal({ hotel, open, onOpenChange, onSave }: EditHotelModalProps) {
  const [destination, setDestination] = useState(hotel.destination);
  const [location, setLocation] = useState(hotel.data.property.location ?? "");
  const [contactPerson, setContactPerson] = useState(hotel.data.property.contactPerson ?? "");
  const [services, setServices] = useState(hotel.data.property.services ?? "");
  const [recommended, setRecommended] = useState(hotel.recommended);
  const [isActive, setIsActive] = useState(hotel.isActive);
  const [validTo, setValidTo] = useState(hotel.data.rate?.validTo ?? "");
  const [rows, setRows] = useState<RoomRateRowDraft[]>(
    hotel.data.rate?.rooms.length ? hotel.data.rate.rooms.map(roomToDraft) : [EMPTY_ROOM_RATE_ROW_DRAFT],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset to the hotel's current saved state every time the modal opens (not
  // on every prop change — mid-edit, the row list shouldn't reset just
  // because a background refresh handed down a new `hotel` object).
  useEffect(() => {
    if (!open) return;
    setDestination(hotel.destination);
    setLocation(hotel.data.property.location ?? "");
    setContactPerson(hotel.data.property.contactPerson ?? "");
    setServices(hotel.data.property.services ?? "");
    setRecommended(hotel.recommended);
    setIsActive(hotel.isActive);
    setValidTo(hotel.data.rate?.validTo ?? "");
    setRows(
      hotel.data.rate?.rooms.length ? hotel.data.rate.rooms.map(roomToDraft) : [EMPTY_ROOM_RATE_ROW_DRAFT],
    );
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hotel.id]);

  async function handleSave() {
    const parsedRows: RoomRateRow[] = [];
    for (const row of rows) {
      const roomType = row.roomType.trim();
      if (!roomType && !row.ep && !row.cp && !row.map) continue; // skip fully-blank rows
      if (!roomType) {
        setError("Every rate row needs a room type.");
        return;
      }
      const ep = parseMoney(row.ep);
      const cp = parseMoney(row.cp);
      const map = parseMoney(row.map);
      if (ep === "invalid" || cp === "invalid" || map === "invalid") {
        setError(`Rates for "${roomType}" must be valid non-negative numbers.`);
        return;
      }
      parsedRows.push({ roomType, ep, cp, map });
    }
    if (parsedRows.length === 0) {
      setError("Add at least one room type.");
      return;
    }

    setError(null);
    setSaving(true);
    const rate: HotelRate = { validTo: validTo || null, rooms: parsedRows };
    const category = computeCategoryFromMap(getDeluxeMapRate(rate));
    const data: HotelData = {
      ...hotel.data,
      property: {
        ...hotel.data.property,
        location: location || null,
        contactPerson: contactPerson || null,
        services: services || null,
      },
      rate,
    };
    const ok = await onSave({ destination, category, isActive, recommended, data });
    setSaving(false);
    if (ok) onOpenChange(false);
    else setError("Save failed — please try again.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit — {hotel.hotelName}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Name, map link, phone, email and rating are edited directly in the table (double-click the
          cell). Everything else is here.
        </DialogDescription>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Destination</label>
              <select value={destination} onChange={(e) => setDestination(e.target.value)} className={inputCls}>
                {HOTEL_DESTINATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Contact Person</label>
              <input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={recommended}
                onChange={(e) => setRecommended(e.target.checked)}
                className="cbx"
              />
              Recommended
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="cbx"
              />
              Active
            </label>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-sm font-bold text-foreground">Room Rates</p>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-muted-foreground">Valid Till</label>
                <input
                  type="date"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-border rounded-lg bg-card outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>
            <RoomRatesEditor rows={rows} onChange={setRows} />
          </div>

          <div className="border-t border-border pt-4">
            <label className={labelCls}>Services</label>
            <textarea
              value={services}
              onChange={(e) => setServices(e.target.value)}
              rows={4}
              className={inputCls}
              placeholder={"One per line, e.g.\nCentral heating\nCentral A/C\nBuffet System"}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="text-sm font-bold text-muted-foreground hover:text-foreground px-4 py-2 rounded-xl border border-border transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
