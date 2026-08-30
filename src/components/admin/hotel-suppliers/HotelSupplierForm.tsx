"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/atoms/badge";
import {
  HOTEL_DESTINATIONS,
  HOTEL_CATEGORY_LABELS,
  computeCategoryFromMap,
  getMinMapRate,
  type RoomRateRow,
} from "@/lib/hotelSuppliers/schema";
import { RoomRatesEditor, EMPTY_ROOM_RATE_ROW_DRAFT, type RoomRateRowDraft } from "./RoomRatesEditor";

const schema = z.object({
  hotelName: z.string().min(2, "Hotel name is required"),
  destination: z.enum(HOTEL_DESTINATIONS),
  location: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  mapUrl: z.string().optional(),
  rating: z.string().optional(),
  services: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultDestination?: string;
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-card";
const labelCls = "block text-xs font-bold text-muted-foreground mb-1.5";

const DESTINATION_SET: readonly string[] = HOTEL_DESTINATIONS;

function parseMoney(v: string): number | null | "invalid" {
  if (v.trim() === "") return null;
  const n = Number(v);
  if (Number.isNaN(n) || n < 0) return "invalid";
  return n;
}

export function HotelSupplierForm({ defaultDestination }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState<RoomRateRowDraft[]>([{ ...EMPTY_ROOM_RATE_ROW_DRAFT }]);
  const [validTo, setValidTo] = useState("");
  const [recommended, setRecommended] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  const initialDestination = DESTINATION_SET.includes(defaultDestination ?? "")
    ? (defaultDestination as (typeof HOTEL_DESTINATIONS)[number])
    : HOTEL_DESTINATIONS[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      hotelName: "",
      destination: initialDestination,
      location: "",
      contactPerson: "",
      phone: "",
      email: "",
      mapUrl: "",
      rating: "",
      services: "",
    },
  });

  // Live preview only — the real category is recomputed server-side too.
  const previewMinMap = (() => {
    const maps = rows.map((r) => parseMoney(r.map)).filter((m): m is number => typeof m === "number");
    return maps.length ? Math.min(...maps) : null;
  })();
  const previewCategory = computeCategoryFromMap(previewMinMap);

  function onSubmit(data: FormData) {
    const parsedRows: RoomRateRow[] = [];
    for (const row of rows) {
      const roomType = row.roomType.trim();
      if (!roomType && !row.ep && !row.cp && !row.map) continue;
      if (!roomType) {
        setRateError("Every rate row needs a room type.");
        return;
      }
      const ep = parseMoney(row.ep);
      const cp = parseMoney(row.cp);
      const map = parseMoney(row.map);
      if (ep === "invalid" || cp === "invalid" || map === "invalid") {
        setRateError(`Rates for "${roomType}" must be valid non-negative numbers.`);
        return;
      }
      parsedRows.push({ roomType, ep, cp, map });
    }
    setRateError(null);

    const rate = parsedRows.length > 0 ? { validTo: validTo || null, rooms: parsedRows } : null;
    const payload = {
      hotelName: data.hotelName,
      destination: data.destination,
      category: computeCategoryFromMap(getMinMapRate(rate)),
      isActive: true,
      recommended,
      data: {
        property: {
          location: data.location || null,
          contactPerson: data.contactPerson || null,
          phone: data.phone || null,
          email: data.email || null,
          mapUrl: data.mapUrl || null,
          services: data.services || null,
        },
        rating: data.rating || null,
        rate,
      },
    };

    startTransition(async () => {
      try {
        const res = await fetch("/api/hotel-suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          if (res.status === 403) {
            toast.error("You don't have permission to add hotel rates.");
            return;
          }
          const err = (await res.json().catch(() => null)) as { error?: string } | null;
          toast.error(typeof err?.error === "string" ? err.error : "Save failed");
          return;
        }
        toast.success("Hotel added!");
        router.push("/admin/hotel-suppliers");
        router.refresh();
      } catch {
        toast.error("An error occurred.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-foreground">Hotel Details</h3>
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={recommended}
              onChange={(e) => setRecommended(e.target.checked)}
              className="cbx"
            />
            Recommended
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Hotel Name *</label>
            <input {...register("hotelName")} className={inputCls} placeholder="e.g. Hotel Rosewood" />
            {errors.hotelName && <p className="text-xs text-red-500 mt-1">{errors.hotelName.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Destination *</label>
            <select {...register("destination")} className={inputCls}>
              {HOTEL_DESTINATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Property Location</label>
            <input {...register("location")} className={inputCls} placeholder="e.g. Dalgate, near Dal Lake" />
          </div>
          <div>
            <label className={labelCls}>Contact Person</label>
            <input {...register("contactPerson")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input {...register("phone")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input {...register("email")} type="email" className={inputCls} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Google Maps URL</label>
            <input {...register("mapUrl")} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Rating</label>
            <input {...register("rating")} className={inputCls} placeholder="e.g. 4.7★ / 2,698 reviews" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Services</label>
            <textarea
              {...register("services")}
              rows={4}
              className={inputCls}
              placeholder={"One per line, e.g.\nCentral heating\nCentral A/C\nBuffet System"}
            />
            <p className="text-[11px] text-muted-foreground mt-1">One service per line.</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">Room Rates</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              The exact supplier net rate for this season — no markup. Add one row per room type
              (Deluxe, Super Deluxe, Extra Bed, etc.).
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] font-bold text-muted-foreground mb-1">Category (auto)</p>
            <Badge>{HOTEL_CATEGORY_LABELS[previewCategory]}</Badge>
          </div>
        </div>
        <RoomRatesEditor rows={rows} onChange={setRows} />
        <div>
          <label className={labelCls}>Valid Till</label>
          <input
            type="date"
            value={validTo}
            onChange={(e) => setValidTo(e.target.value)}
            className={`${inputCls} max-w-[200px]`}
          />
        </div>
        {rateError && <p className="text-xs text-red-500">{rateError}</p>}
        <p className="text-[11px] text-muted-foreground">
          Category is set from the cheapest room&apos;s MAP rate: &lt;2,500 Budget · &lt;7,000 Deluxe · else
          Premium
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-primary/25 disabled:opacity-60"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Add Hotel
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/hotel-suppliers")}
          className="text-sm font-bold text-muted-foreground hover:text-foreground px-5 py-2.5 rounded-xl border border-border transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
