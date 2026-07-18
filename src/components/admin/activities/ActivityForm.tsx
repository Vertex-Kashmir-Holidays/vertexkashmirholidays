"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { ImageField } from "@/components/admin/pages/ImageField";
import { SectionArrayEditor } from "@/components/admin/pages/SectionArrayEditor";
import { LinkChecklist } from "@/components/admin/activities/LinkChecklist";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase, numbers, hyphens only"),
  description: z.string().optional(),
  location: z.string().optional(),
  icon: z.string().optional(),
  duration: z.string().optional(),
  price: z
    .string()
    .regex(/^\d*\.?\d*$/, "Numbers only")
    .optional(),
  whyExperience: z.string().optional(),
  bestTime: z.string().optional(),
  difficulty: z.string().optional(),
  pricingGuide: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export interface ActivityDefaults extends Partial<FormData> {
  id?: string;
  coverImage?: string;
  coverImageMobile?: string;
  images?: string; // JSON string array
  activityHighlights?: string; // JSON string array
  suitableFor?: string; // JSON string array
  safetyTips?: string; // JSON string array
  whatToCarry?: string; // JSON string array
  ogImage?: string;
  published?: boolean;
  destinationIds?: string[];
  tourIds?: string[];
}

interface Option {
  id: string;
  label: string;
}

interface Props {
  defaults?: ActivityDefaults;
  destinationOptions: Option[];
  tourOptions: Option[];
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition";

export function ActivityForm({ defaults, destinationOptions, tourOptions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!defaults?.id;

  const [coverImage, setCoverImage] = useState(defaults?.coverImage ?? "");
  const [coverImageMobile, setCoverImageMobile] = useState(defaults?.coverImageMobile ?? "");
  const [ogImage, setOgImage] = useState(defaults?.ogImage ?? "");
  const [images, setImages] = useState(defaults?.images ?? "[]");
  const [activityHighlights, setActivityHighlights] = useState(
    defaults?.activityHighlights ?? "[]",
  );
  const [suitableFor, setSuitableFor] = useState(defaults?.suitableFor ?? "[]");
  const [safetyTips, setSafetyTips] = useState(defaults?.safetyTips ?? "[]");
  const [whatToCarry, setWhatToCarry] = useState(defaults?.whatToCarry ?? "[]");
  const [published, setPublished] = useState(defaults?.published ?? false);
  const [destinationIds, setDestinationIds] = useState<string[]>(defaults?.destinationIds ?? []);
  const [tourIds, setTourIds] = useState<string[]>(defaults?.tourIds ?? []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaults?.name ?? "",
      slug: defaults?.slug ?? "",
      description: defaults?.description ?? "",
      location: defaults?.location ?? "",
      icon: defaults?.icon ?? "",
      duration: defaults?.duration ?? "",
      price: defaults?.price ?? "",
      whyExperience: defaults?.whyExperience ?? "",
      bestTime: defaults?.bestTime ?? "",
      difficulty: defaults?.difficulty ?? "",
      pricingGuide: defaults?.pricingGuide ?? "",
      metaTitle: defaults?.metaTitle ?? "",
      metaDesc: defaults?.metaDesc ?? "",
    },
  });

  const nameVal = watch("name");
  useEffect(() => {
    if (!isEdit && nameVal) setValue("slug", slugify(nameVal));
  }, [nameVal, isEdit, setValue]);

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        const url = isEdit ? `/api/activities/${defaults!.id}` : "/api/activities";
        const method = isEdit ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            coverImage,
            coverImageMobile,
            ogImage,
            images,
            activityHighlights,
            suitableFor,
            safetyTips,
            whatToCarry,
            published,
            destinationIds,
            tourIds,
          }),
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          toast.error(typeof err.error === "string" ? err.error : "Save failed");
          return;
        }
        toast.success(isEdit ? "Activity updated!" : "Activity created!");
        router.push("/admin/activities");
        router.refresh();
      } catch {
        toast.error("An error occurred.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Two-column grid — left: Activity Details + Media, right: Links + SEO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6">
          {/* Activity Details */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-foreground text-sm">Activity Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Name *
                </label>
                <input {...register("name")} className={inputCls} placeholder="e.g. Gondola Ride" />
                {errors.name && (
                  <p className="text-[12px] text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Slug *
                </label>
                <input {...register("slug")} className={`${inputCls} font-mono`} />
                {errors.slug && (
                  <p className="text-[12px] text-red-500 mt-1">{errors.slug.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Location
                </label>
                <input {...register("location")} className={inputCls} placeholder="e.g. Gulmarg" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Icon (emoji)
                </label>
                <input {...register("icon")} className={inputCls} placeholder="e.g. 🚡" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Duration
                </label>
                <input {...register("duration")} className={inputCls} placeholder="e.g. 2 hours" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Price (₹)
                </label>
                <input
                  {...register("price")}
                  inputMode="decimal"
                  className={`${inputCls} font-mono`}
                  placeholder="e.g. 1500"
                />
                {errors.price && (
                  <p className="text-[12px] text-red-500 mt-1">{errors.price.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Difficulty
                </label>
                <input
                  {...register("difficulty")}
                  className={inputCls}
                  placeholder="e.g. Very Easy, Moderate"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={4}
                className={`${inputCls} resize-none`}
                placeholder="What is this activity about?"
              />
            </div>
          </div>

          {/* Media */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-foreground text-sm">Media</h3>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Cover Image
              </label>
              <ImageField value={coverImage} onChange={setCoverImage} folder="activities" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Cover Image (Mobile)
              </label>
              <p className="text-[12px] text-muted-foreground mb-1">
                Shown on phones instead of the desktop Cover Image. Leave blank to reuse the desktop
                image.
              </p>
              <ImageField
                value={coverImageMobile}
                onChange={setCoverImageMobile}
                folder="activities"
              />
            </div>
            <SectionArrayEditor
              label="Gallery images"
              value={images}
              onChange={setImages}
              spec={{ kind: "scalar", type: "image" }}
              folder="activities"
            />
          </div>

          {/* Experience Content */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-foreground text-sm">Experience Content</h3>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Why Experience This
              </label>
              <p className="text-[12px] text-muted-foreground mb-1">HTML is accepted.</p>
              <textarea
                {...register("whyExperience")}
                rows={4}
                className={`${inputCls} resize-none`}
                placeholder="What makes this experience worth doing..."
              />
            </div>
            <SectionArrayEditor
              label="Activity Highlights"
              value={activityHighlights}
              onChange={setActivityHighlights}
              spec={{
                kind: "object",
                fields: [
                  { key: "name", label: "Name" },
                  { key: "description", label: "Description", type: "textarea" },
                ],
              }}
            />
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Best Time
              </label>
              <p className="text-[12px] text-muted-foreground mb-1">HTML is accepted.</p>
              <textarea
                {...register("bestTime")}
                rows={4}
                className={`${inputCls} resize-none`}
                placeholder="Season / time-of-day breakdown..."
              />
            </div>
            <SectionArrayEditor
              label="Suitable For"
              value={suitableFor}
              onChange={setSuitableFor}
              spec={{ kind: "scalar" }}
            />
          </div>

          {/* Pricing & Safety */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-foreground text-sm">Pricing &amp; Safety</h3>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Pricing Guide
              </label>
              <p className="text-[12px] text-muted-foreground mb-1">
                HTML is accepted. Ticket/pricing policy, inclusions, exclusions.
              </p>
              <textarea
                {...register("pricingGuide")}
                rows={5}
                className={`${inputCls} resize-none`}
                placeholder="Ticket & pricing guide..."
              />
            </div>
            <SectionArrayEditor
              label="Safety Tips"
              value={safetyTips}
              onChange={setSafetyTips}
              spec={{ kind: "scalar" }}
            />
            <SectionArrayEditor
              label="What to Carry"
              value={whatToCarry}
              onChange={setWhatToCarry}
              spec={{ kind: "scalar" }}
            />
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-6">
          {/* Linked Destinations & Tours */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
            <div>
              <h3 className="font-bold text-foreground text-sm">Linked Destinations &amp; Tours</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                This activity appears under the selected destinations and tours.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LinkChecklist
                title="Destinations"
                options={destinationOptions}
                value={destinationIds}
                onChange={setDestinationIds}
              />
              <LinkChecklist
                title="Tours"
                options={tourOptions}
                value={tourIds}
                onChange={setTourIds}
              />
            </div>
          </div>

          {/* SEO & Visibility */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-foreground text-sm">SEO &amp; Visibility</h3>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Meta Title
              </label>
              <input {...register("metaTitle")} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Meta Description
              </label>
              <textarea {...register("metaDesc")} rows={2} className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                OG Image
              </label>
              <ImageField value={ogImage} onChange={setOgImage} folder="activities" />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Published
            </label>
          </div>
        </div>
      </div>

      {/* CTA — centered below both columns */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Create Activity"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/activities")}
          className="text-sm text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-xl border border-border transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
