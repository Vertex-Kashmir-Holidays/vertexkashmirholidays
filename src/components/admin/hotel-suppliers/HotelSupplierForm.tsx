"use client";

import { useTransition } from "react";
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
} from "@/lib/hotelSuppliers/schema";

const money = z
  .string()
  .regex(/^\d*\.?\d*$/, "Numbers only")
  .optional();

const schema = z.object({
  hotelName: z.string().min(2, "Hotel name is required"),
  destination: z.enum(HOTEL_DESTINATIONS),
  location: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  mapUrl: z.string().optional(),
  rating: z.string().optional(),
  validTo: z.string().optional(),
  ep: money,
  cp: money,
  map: money,
  ap: money,
  extraBed: money,
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultDestination?: string;
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-card";
const labelCls = "block text-xs font-bold text-muted-foreground mb-1.5";

const DESTINATION_SET: readonly string[] = HOTEL_DESTINATIONS;

export function HotelSupplierForm({ defaultDestination }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initialDestination = DESTINATION_SET.includes(defaultDestination ?? "")
    ? (defaultDestination as (typeof HOTEL_DESTINATIONS)[number])
    : HOTEL_DESTINATIONS[0];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      hotelName: "",
      destination: initialDestination,
      location: "",
      contactPerson: "",
      phone: "",
      email: "",
      mapUrl: "",
      rating: "",
      validTo: "",
      ep: "",
      cp: "",
      map: "",
      ap: "",
      extraBed: "",
    },
  });

  const mapValue = watch("map");
  const previewCategory = computeCategoryFromMap(mapValue ? Number(mapValue) : null);

  function onSubmit(data: FormData) {
    const payload = {
      hotelName: data.hotelName,
      destination: data.destination,
      category: computeCategoryFromMap(data.map ? Number(data.map) : null),
      isActive: true,
      data: {
        property: {
          location: data.location || null,
          contactPerson: data.contactPerson || null,
          phone: data.phone || null,
          email: data.email || null,
          mapUrl: data.mapUrl || null,
        },
        rating: data.rating || null,
        rate: {
          validTo: data.validTo || null,
          mealPlans: {
            EP: data.ep ? Number(data.ep) : null,
            CP: data.cp ? Number(data.cp) : null,
            MAP: data.map ? Number(data.map) : null,
            AP: data.ap ? Number(data.ap) : null,
          },
          extraBed: data.extraBed ? Number(data.extraBed) : null,
        },
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
        <h3 className="text-sm font-bold text-foreground">Hotel Details</h3>
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
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">Current Rate</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              The exact supplier net rate for this season — no markup. Edit these fields in place whenever the
              season rate changes.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] font-bold text-muted-foreground mb-1">Category (auto)</p>
            <Badge>{HOTEL_CATEGORY_LABELS[previewCategory]}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className={labelCls}>EP Net</label>
            <input {...register("ep")} className={inputCls} placeholder="0" />
          </div>
          <div>
            <label className={labelCls}>CP Net</label>
            <input {...register("cp")} className={inputCls} placeholder="0" />
            {errors.cp && <p className="text-xs text-red-500 mt-1">{errors.cp.message}</p>}
          </div>
          <div>
            <label className={labelCls}>MAP Net</label>
            <input {...register("map")} className={inputCls} placeholder="0" />
          </div>
          <div>
            <label className={labelCls}>AP Net</label>
            <input {...register("ap")} className={inputCls} placeholder="0" />
          </div>
          <div>
            <label className={labelCls}>Extra Bed</label>
            <input {...register("extraBed")} className={inputCls} placeholder="0" />
          </div>
          <div>
            <label className={labelCls}>Valid Till</label>
            <input type="date" {...register("validTo")} className={inputCls} />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          MAP sets category: &lt;2,500 Budget · &lt;7,000 Deluxe · else Premium
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
