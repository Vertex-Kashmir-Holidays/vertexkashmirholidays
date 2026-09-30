"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import type { OccasionType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { ImageField } from "@/components/admin/pages/ImageField";
import { SectionArrayEditor } from "@/components/admin/pages/SectionArrayEditor";
import { VideoField } from "@/components/admin/pages/VideoField";
import {
  OCCASION_LABELS,
  OCCASION_TYPES,
  defaultOfferCta,
  formatDuration,
  formatTripDay,
  offerPublishBlockers,
  tripNights,
  type OfferCompareRow,
  type OfferItineraryDay,
} from "@/lib/offers/content";
import { OfferPackagesEditor, packagePayload, type PackageDraft } from "./OfferPackagesEditor";
import { OfferDaysEditor, padDays, type DestinationOption } from "./OfferDaysEditor";
import { OfferCompareRowsEditor } from "./OfferCompareRowsEditor";
import type { CatalogHotel } from "@/lib/offers/hotelCatalog";

// Admin editor for an Occasion Offer — one form for create (POST) and edit
// (PATCH), split into tabs so marketing can go straight to e.g. Packages &
// Pricing. Scalar fields live in React Hook Form; content arrays are stored
// as the JSON strings SectionArrayEditor edits; package tiers and related
// tours are plain state. The server re-validates everything
// (src/lib/offers/content.ts).

const TABS = [
  "Basic Information",
  "Dates & Occasion",
  "Hero",
  "Packages & Pricing",
  "Itinerary",
  "Content",
  "Inclusions",
  "FAQs",
  "SEO",
  "Publishing",
] as const;
type Tab = (typeof TABS)[number];

const schema = z.object({
  name: z.string().trim().min(3, "Name is required"),
  slug: z
    .string()
    .trim()
    .min(3, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers, hyphens only"),
  occasionType: z.enum(OCCASION_TYPES),
  startDate: z.string(),
  endDate: z.string(),
  shortDescription: z.string(),
  heroTitle: z.string(),
  heroSubtitle: z.string(),
  heroImage: z.string(),
  heroImageMobile: z.string(),
  ctaLabel: z.string(),
  overview: z.string(),
  whyThisOffer: z.string(),
  inclusions: z.string(),
  exclusions: z.string(),
  gallery: z.string(),
  activitiesTitle: z.string(),
  activitiesIntro: z.string(),
  activitiesNote: z.string(),
  activities: z.string(),
  filmUrl: z.string(),
  filmPoster: z.string(),
  faqs: z.string(),
  metaTitle: z.string(),
  metaDesc: z.string(),
  canonicalUrl: z.string(),
  ogTitle: z.string(),
  ogDesc: z.string(),
  ogImage: z.string(),
  noindex: z.boolean(),
  published: z.boolean(),
  sortOrder: z.coerce.number().int(),
});

export type OfferFormValues = z.infer<typeof schema>;

export interface OfferFormDefaults {
  id?: string;
  values: OfferFormValues;
  packages: PackageDraft[];
  itinerary: OfferItineraryDay[];
  compareRows: OfferCompareRow[];
  relatedTourIds: string[];
}

export const EMPTY_OFFER_VALUES: OfferFormValues = {
  name: "",
  slug: "",
  occasionType: "OTHER",
  startDate: "",
  endDate: "",
  shortDescription: "",
  heroTitle: "",
  heroSubtitle: "",
  heroImage: "",
  heroImageMobile: "",
  ctaLabel: "",
  overview: "",
  whyThisOffer: "[]",
  inclusions: "[]",
  exclusions: "[]",
  gallery: "[]",
  activitiesTitle: "",
  activitiesIntro: "",
  activitiesNote: "",
  activities: "[]",
  filmUrl: "",
  filmPoster: "",
  faqs: "[]",
  metaTitle: "",
  metaDesc: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDesc: "",
  ogImage: "",
  noindex: false,
  published: false,
  sortOrder: 0,
};

const JSON_ARRAY_FIELDS = [
  "whyThisOffer",
  "inclusions",
  "exclusions",
  "gallery",
  "faqs",
  "activities",
] as const;

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const parseArray = (json: string): unknown[] => {
  try {
    const v = JSON.parse(json || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const inputCls =
  "w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1";
const hintCls = "text-[12px] text-muted-foreground mt-1";
const cardCls = "bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-6 space-y-4";

/** Reads a zod-flatten / string API error into one toast line. */
async function apiError(res: Response): Promise<string> {
  if (res.status === 403) return "You don't have permission to do that.";
  const body = (await res.json().catch(() => ({}))) as {
    error?: string | { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
  };
  if (typeof body.error === "string") return body.error;
  const field = Object.entries(body.error?.fieldErrors ?? {})[0];
  if (field) return `${field[0]}: ${field[1][0]}`;
  return body.error?.formErrors?.[0] ?? "Save failed";
}

export function OfferForm({
  defaults,
  tours,
  destinations,
  hotelCatalog,
}: {
  defaults?: OfferFormDefaults;
  tours: { id: string; title: string }[];
  destinations: DestinationOption[];
  /** Public-approved Hotel Rates hotels for the "Add from Hotel Rates" picker. */
  hotelCatalog: CatalogHotel[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("Basic Information");
  const [packages, setPackages] = useState<PackageDraft[]>(defaults?.packages ?? []);
  const [days, setDays] = useState<OfferItineraryDay[]>(defaults?.itinerary ?? []);
  const [compareRows, setCompareRows] = useState<OfferCompareRow[]>(defaults?.compareRows ?? []);
  const [relatedTourIds, setRelatedTourIds] = useState<string[]>(defaults?.relatedTourIds ?? []);
  const [tourFilter, setTourFilter] = useState("");
  const isEdit = !!defaults?.id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OfferFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: defaults?.values ?? EMPTY_OFFER_VALUES,
  });

  const v = watch();

  useEffect(() => {
    if (!isEdit && v.name) setValue("slug", slugify(v.name));
  }, [v.name, isEdit, setValue]);

  // The fixed dates drive everything: days in the itinerary, nights per plan.
  const startDate = v.startDate ? new Date(`${v.startDate}T00:00:00.000Z`) : null;
  const endDate = v.endDate ? new Date(`${v.endDate}T00:00:00.000Z`) : null;
  const nights = tripNights(startDate, endDate);
  const validNights = nights && nights > 0 ? nights : null;
  const dayLabel = (i: number) => (startDate ? formatTripDay(startDate, i) : null);
  const itineraryPayload = validNights ? padDays(days, validNights + 1) : days;

  const blockers = offerPublishBlockers({
    startDate,
    endDate,
    itineraryDays: itineraryPayload.length,
    packages: packages.map((p) => ({
      name: p.name,
      published: p.published,
      priceForTwo: Number(p.priceForTwo || 0),
      nights: packagePayload(p, validNights).stays.length,
    })),
  });

  const visibleTours = useMemo(() => {
    const q = tourFilter.trim().toLowerCase();
    return q ? tours.filter((t) => t.title.toLowerCase().includes(q)) : tours;
  }, [tours, tourFilter]);

  function onSubmit(values: OfferFormValues) {
    const payload = {
      ...values,
      ...Object.fromEntries(JSON_ARRAY_FIELDS.map((f) => [f, parseArray(values[f])])),
      itinerary: itineraryPayload,
      compareRows,
      packages: packages.map((p) => packagePayload(p, validNights)),
      relatedTourIds,
    };
    startTransition(async () => {
      try {
        const res = await fetch(
          isEdit ? `/api/occasion-offers/${defaults!.id}` : "/api/occasion-offers",
          {
            method: isEdit ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (!res.ok) {
          toast.error(await apiError(res));
          return;
        }
        toast.success(isEdit ? "Offer saved." : "Offer created.");
        router.push("/admin/offers");
        router.refresh();
      } catch {
        toast.error("An error occurred.");
      }
    });
  }

  // Only name/slug have client-side rules, both on the first tab.
  function onInvalid(errs: FieldErrors<OfferFormValues>) {
    toast.error("Please fix the highlighted fields.");
    if (errs.name || errs.slug) setTab("Basic Information");
  }

  const setJson = (field: (typeof JSON_ARRAY_FIELDS)[number]) => (json: string) =>
    setValue(field, json, { shouldDirty: true });

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5">
      {/* Tabs — wrap on small screens rather than scroll horizontally. */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
              tab === t
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className={cardCls}>
        {tab === "Basic Information" && (
          <>
            <div>
              <label className={labelCls}>Offer name *</label>
              <input
                {...register("name")}
                className={inputCls}
                placeholder="e.g. Diwali Kashmir Tour Package 2026"
              />
              {errors.name && (
                <p className="text-[12px] text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>URL slug *</label>
              <input
                {...register("slug")}
                className={`${inputCls} font-mono`}
                placeholder="e.g. diwali-kashmir-tour-package-2026"
              />
              <p className={hintCls}>
                Public URL: /offers/{v.slug || "…"}. Changing it later breaks links already shared
                in ads.
              </p>
              {errors.slug && (
                <p className="text-[12px] text-red-500 mt-1">{errors.slug.message}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Short description</label>
              <textarea
                {...register("shortDescription")}
                rows={3}
                className={`${inputCls} resize-none`}
              />
              <p className={hintCls}>
                Opens the Trip Overview; also the fallback meta description.
              </p>
            </div>
          </>
        )}

        {tab === "Dates & Occasion" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Occasion</label>
                <select {...register("occasionType")} className={inputCls}>
                  {OCCASION_TYPES.map((o) => (
                    <option key={o} value={o}>
                      {OCCASION_LABELS[o as OccasionType]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Duration</label>
                <p className="px-1 py-2 text-sm font-semibold text-foreground">
                  {validNights ? formatDuration(validNights) : "Set both dates"}
                </p>
              </div>
              <div>
                <label className={labelCls}>Start date</label>
                <input type="date" {...register("startDate")} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>End date</label>
                <input type="date" {...register("endDate")} className={inputCls} />
              </div>
            </div>
            <p className={hintCls}>
              The dates are fixed for the offer and shown on the page — visitors aren&apos;t asked
              for them. Required before publishing.
            </p>
          </>
        )}

        {tab === "Hero" && (
          <>
            <div>
              <label className={labelCls}>Hero title (H1)</label>
              <input {...register("heroTitle")} className={inputCls} placeholder={v.name} />
              <p className={hintCls}>Leave blank to use the offer name.</p>
            </div>
            <div>
              <label className={labelCls}>Hero subtitle</label>
              <textarea
                {...register("heroSubtitle")}
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div>
              <label className={labelCls}>CTA button text</label>
              <input
                {...register("ctaLabel")}
                className={inputCls}
                placeholder={defaultOfferCta(v.occasionType)}
              />
              <p className={hintCls}>Leave blank for “{defaultOfferCta(v.occasionType)}”.</p>
            </div>
            <div>
              <label className={labelCls}>Hero image (desktop)</label>
              <ImageField
                value={v.heroImage}
                onChange={(url) => setValue("heroImage", url)}
                folder="offers"
              />
            </div>
            <div>
              <label className={labelCls}>Hero image (mobile, optional)</label>
              <ImageField
                value={v.heroImageMobile}
                onChange={(url) => setValue("heroImageMobile", url)}
                folder="offers"
              />
              <p className={hintCls}>Leave blank to reuse the desktop image.</p>
            </div>
          </>
        )}

        {tab === "Packages & Pricing" && (
          <OfferPackagesEditor
            value={packages}
            onChange={setPackages}
            nights={validNights}
            nightLabel={dayLabel}
            destinations={destinations}
            catalog={hotelCatalog}
          />
        )}
        {tab === "Packages & Pricing" && packages.length > 0 && (
          <div className="border-t border-border pt-5">
            <h3 className="mb-2 text-sm font-bold text-foreground">
              Compare Plans — activities, transport &amp; more
            </h3>
            <OfferCompareRowsEditor
              rows={compareRows}
              onRowsChange={setCompareRows}
              packages={packages}
              onPackagesChange={setPackages}
            />
          </div>
        )}

        {tab === "Itinerary" && (
          <OfferDaysEditor
            value={days}
            onChange={setDays}
            dayCount={validNights ? validNights + 1 : null}
            dayLabel={dayLabel}
            destinations={destinations}
          />
        )}

        {tab === "Content" && (
          <>
            <div>
              <label className={labelCls}>Overview (HTML)</label>
              <textarea
                {...register("overview")}
                rows={10}
                className={`${inputCls} font-mono text-xs`}
              />
              <p className={hintCls}>
                Use &lt;h3&gt;/&lt;p&gt;/&lt;ul&gt;. Only state what&apos;s actually confirmed — no
                guaranteed snowfall, events or hotel names unless they&apos;re booked.
              </p>
            </div>
            <SectionArrayEditor
              label="Why this season"
              description="Occasion-specific reasons to book (heading + short text)."
              value={v.whyThisOffer}
              onChange={setJson("whyThisOffer")}
              spec={{
                kind: "object",
                fields: [
                  { key: "title", label: "Heading" },
                  { key: "text", label: "Text", type: "textarea" },
                ],
              }}
              folder="offers"
            />
            <div className="space-y-3 rounded-2xl border border-border p-4">
              <p className="text-sm font-bold text-foreground">Optional activities</p>
              <p className={hintCls}>
                Add-on cards shown after the stays (e.g. skiing, sledging, pony rides on the snow
                offers). Not part of the package price — each card&apos;s button opens the enquiry
                form. Leave empty to hide the section.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Section title</label>
                  <input
                    {...register("activitiesTitle")}
                    className={inputCls}
                    placeholder="Add-On Activities"
                  />
                </div>
                <div>
                  <label className={labelCls}>Note under the cards</label>
                  <input
                    {...register("activitiesNote")}
                    className={inputCls}
                    placeholder="e.g. Snow activities depend on snowfall and weather on the day."
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Intro</label>
                <input
                  {...register("activitiesIntro")}
                  className={inputCls}
                  placeholder="Not part of the package price — add any of these to your plan and we'll book them for you."
                />
              </div>
              <SectionArrayEditor
                label="Activity cards"
                value={v.activities}
                onChange={setJson("activities")}
                spec={{
                  kind: "object",
                  fields: [
                    { key: "title", label: "Activity", placeholder: "e.g. Skiing" },
                    { key: "description", label: "Short description", type: "textarea" },
                    {
                      key: "priceNote",
                      label: "Price note (optional)",
                      placeholder: "e.g. From ₹2,500 per person",
                    },
                    { key: "image", label: "Photo", type: "image" },
                  ],
                }}
                folder="offers"
              />
            </div>
            <SectionArrayEditor
              label="Photo gallery"
              description="Real trip photos — the first one is shown large."
              value={v.gallery}
              onChange={setJson("gallery")}
              spec={{ kind: "scalar", type: "image" }}
              folder="offers"
            />
            <div>
              <label className={labelCls}>Campaign film (optional)</label>
              <VideoField
                value={v.filmUrl}
                onChange={(url) => setValue("filmUrl", url)}
                folder="offers"
              />
              <p className={hintCls}>Uploaded videos play with the Vertex logo overlay.</p>
            </div>
            <div>
              <label className={labelCls}>Film poster image</label>
              <ImageField
                value={v.filmPoster}
                onChange={(url) => setValue("filmPoster", url)}
                folder="offers"
              />
            </div>
            <div>
              <label className={labelCls}>Related tours (internal links)</label>
              <input
                value={tourFilter}
                onChange={(e) => setTourFilter(e.target.value)}
                className={`${inputCls} mb-2`}
                placeholder="Filter tours…"
              />
              <div className="max-h-56 overflow-y-auto rounded-xl border border-border p-2 space-y-1">
                {visibleTours.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={relatedTourIds.includes(t.id)}
                      onChange={(e) =>
                        setRelatedTourIds((ids) =>
                          e.target.checked ? [...ids, t.id] : ids.filter((x) => x !== t.id),
                        )
                      }
                      className="h-4 w-4 accent-primary"
                    />
                    {t.title}
                  </label>
                ))}
              </div>
              <p className={hintCls}>
                Up to 4 published tours are linked under “Keep Exploring”. Keep it to genuinely
                relevant ones.
              </p>
            </div>
          </>
        )}

        {tab === "Inclusions" && (
          <>
            <SectionArrayEditor
              label="Included (all packages)"
              value={v.inclusions}
              onChange={setJson("inclusions")}
              spec={{ kind: "scalar", type: "text" }}
              folder="offers"
            />
            <SectionArrayEditor
              label="Not included"
              value={v.exclusions}
              onChange={setJson("exclusions")}
              spec={{ kind: "scalar", type: "text" }}
              folder="offers"
            />
            <p className={hintCls}>
              Tier-specific inclusions (e.g. hotel category) go on each package instead.
            </p>
          </>
        )}

        {tab === "FAQs" && (
          <SectionArrayEditor
            label="Offer FAQs"
            description="Shown in full on the page and used for its FAQ structured data."
            value={v.faqs}
            onChange={setJson("faqs")}
            spec={{
              kind: "object",
              fields: [
                { key: "question", label: "Question" },
                { key: "answer", label: "Answer", type: "textarea" },
              ],
            }}
            folder="offers"
          />
        )}

        {tab === "SEO" && (
          <>
            <div>
              <label className={labelCls}>SEO title</label>
              <input {...register("metaTitle")} className={inputCls} placeholder={v.name} />
            </div>
            <div>
              <label className={labelCls}>Meta description</label>
              <textarea {...register("metaDesc")} rows={3} className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className={labelCls}>Canonical URL</label>
              <input
                {...register("canonicalUrl")}
                className={inputCls}
                placeholder="Leave blank to use this offer's own URL"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>OG title</label>
                <input {...register("ogTitle")} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>OG description</label>
                <input {...register("ogDesc")} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>OG image</label>
              <ImageField
                value={v.ogImage}
                onChange={(url) => setValue("ogImage", url)}
                folder="offers"
              />
              <p className={hintCls}>Leave blank to reuse the hero image.</p>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <input type="checkbox" {...register("noindex")} className="h-4 w-4 accent-primary" />
              Hide from search engines (noindex, left out of the sitemap)
            </label>
          </>
        )}

        {tab === "Publishing" && (
          <>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <input
                type="checkbox"
                {...register("published")}
                className="h-4 w-4 accent-primary"
              />
              Published — the page is live at /offers/{v.slug || "…"}
            </label>
            {blockers.length > 0 ? (
              <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-[13px] text-amber-700 dark:text-amber-300">
                Before this can be published: {blockers.join(", ")}.
              </p>
            ) : (
              <p className={hintCls}>Ready to publish. Unpublished offers return 404.</p>
            )}
            <div className="max-w-[200px]">
              <label className={labelCls}>Sort order</label>
              <input type="number" {...register("sortOrder")} className={inputCls} />
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Create Offer"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/offers")}
          className="text-sm text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-xl border border-border transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
