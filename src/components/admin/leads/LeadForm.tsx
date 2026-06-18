"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ChevronDown } from "lucide-react";

// All fields kept as strings so react-hook-form/zod inference is stable.
// Numeric and enum coercion happens in onSubmit before sending to the API.
const schema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(6, "Valid phone number required"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  source: z.string().optional(),
  category: z.string().optional(),
  adults: z.string().optional(),
  children: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  followUpAt: z.string().optional(),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface StaffUser {
  id: string;
  name: string | null;
}

interface Props {
  staffUsers: StaffUser[];
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition";

const selectWrapCls = "relative";

const selectCls =
  "w-full pl-3 pr-8 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition appearance-none bg-card";

export function LeadForm({ staffUsers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { source: "MANUAL", adults: "1" },
  });

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        const adults = data.adults ? parseInt(data.adults, 10) : 1;
        const children = data.children ? parseInt(data.children, 10) : undefined;

        const res = await fetch("/api/admin/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            phone: data.phone,
            email: data.email || undefined,
            source: data.source || "MANUAL",
            category: data.category || undefined,
            adults: isNaN(adults) ? 1 : adults,
            children: children !== undefined && !isNaN(children) ? children : undefined,
            startDate: data.startDate || undefined,
            endDate: data.endDate || undefined,
            followUpAt: data.followUpAt || undefined,
            assignedToId: data.assignedToId || undefined,
            notes: data.notes || undefined,
          }),
        });

        if (!res.ok) {
          const j = (await res.json()) as { error?: string | { formErrors?: string[] } };
          const msg = typeof j.error === "string" ? j.error : "Save failed.";
          toast.error(msg);
          return;
        }

        toast.success("Lead created!");
        router.push("/admin/leads");
        router.refresh();
      } catch {
        toast.error("An error occurred.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {/* Contact Details */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-foreground text-sm">Contact Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Name *</label>
            <input {...register("name")} className={inputCls} placeholder="Full name" />
            {errors.name && <p className="text-[10px] text-red-500 dark:text-red-400 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Phone *</label>
            <input {...register("phone")} type="tel" className={inputCls} placeholder="+91 98765 43210" />
            {errors.phone && <p className="text-[10px] text-red-500 dark:text-red-400 mt-1">{errors.phone.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Email</label>
          <input {...register("email")} type="email" className={inputCls} placeholder="optional@email.com" />
          {errors.email && <p className="text-[10px] text-red-500 dark:text-red-400 mt-1">{errors.email.message}</p>}
        </div>
      </div>

      {/* Trip Details */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-foreground text-sm">Trip Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Travel Start</label>
            <input {...register("startDate")} type="date" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Travel End</label>
            <input {...register("endDate")} type="date" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Adults</label>
            <input {...register("adults")} type="number" min={1} className={inputCls} placeholder="1" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Children</label>
            <input {...register("children")} type="number" min={0} className={inputCls} placeholder="0" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Follow-up Date &amp; Time</label>
          <input {...register("followUpAt")} type="datetime-local" className={inputCls} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Category</label>
          <div className={selectWrapCls}>
            <select {...register("category")} className={selectCls}>
              <option value="">— Select —</option>
              <option value="HONEYMOON_TOUR">Honeymoon</option>
              <option value="COUPLE">Couple</option>
              <option value="FAMILY_TOUR">Family</option>
              <option value="GROUP_TOUR">Group</option>
              <option value="SKI_TOUR">Ski</option>
              <option value="OFFBEAT_TOUR">Offbeat</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Source & Assignment */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-foreground text-sm">Source & Assignment</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Source</label>
            <div className={selectWrapCls}>
              <select {...register("source")} className={selectCls}>
                <option value="MANUAL">Manual</option>
                <option value="WEBSITE">Website</option>
                <option value="REFERRAL">Referral</option>
                <option value="GOOGLE_ADS">Google Ads</option>
                <option value="META_ADS">Meta Ads</option>
                <option value="THIRD_PARTY">Third Party</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Assign To</label>
            <div className={selectWrapCls}>
              <select {...register("assignedToId")} className={selectCls}>
                <option value="">Unassigned</option>
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ?? u.id}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Notes</label>
          <textarea
            {...register("notes")}
            rows={3}
            className={`${inputCls} resize-none`}
            placeholder="Any notes about this lead..."
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Lead
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/leads")}
          className="text-sm text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-xl border border-border transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
