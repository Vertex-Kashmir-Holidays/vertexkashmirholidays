"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plus, Trash2, Upload, Loader2, Eye,
  GripVertical, ImageIcon, X, Images,
  CheckCircle2, XCircle, Save, Star, HelpCircle,
} from "lucide-react";
import { GalleryPicker } from "@/components/admin/pages/GalleryPicker";
import { LinkChecklist, type LinkOption } from "@/components/admin/activities/LinkChecklist";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { stringifyList } from "@/lib/tours/content";

// ── Schema ────────────────────────────────────────────────────────────────────

const itineraryDaySchema = z.object({
  day: z.number().int().min(1),
  title: z.string().min(1, "Title required"),
  description: z.string().default(""),
  image: z.string().default(""),
  meals: z.string().default(""),
  stay: z.string().default(""),
  travelTips: z.string().default(""),
});

const listItemSchema = z.object({ value: z.string() });
const faqItemSchema = z.object({ question: z.string().default(""), answer: z.string().default("") });
const galleryItemSchema = z.object({ url: z.string(), alt: z.string().default("") });
const batchSchema = z.object({
  date: z.string().min(1, "Date required"),
  seats: z.number().int().min(1, "At least 1 seat"),
  price: z.string().min(1, "Price required"),
  status: z.enum(["open", "filling", "sold"]),
});

const accommodationItemSchema = z.object({ location: z.string().default(""), description: z.string().default("") });
const budgetRowSchema = z.object({
  category: z.string().default(""),
  perPerson: z.string().default(""),
  perFamily: z.string().default(""),
  note: z.string().default(""),
});
const expenseRowSchema = z.object({
  activity: z.string().default(""),
  cost: z.string().default(""),
  mandatory: z.boolean().default(false),
});
const packingItemSchema = z.object({
  item: z.string().default(""),
  reason: z.string().default(""),
  mandatory: z.boolean().default(false),
});
const noteItemSchema = z.object({ text: z.string().default(""), reviewNote: z.string().default("") });
const relatedTourItemSchema = z.object({ tourId: z.string().default(""), ctaSentence: z.string().default("") });

const nanToNull = z.preprocess(
  (v) => (v === "" || v === null || v === undefined || (typeof v === "number" && isNaN(v)) ? null : Number(v)),
  z.number().positive().nullable(),
);

const packageSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  category: z.enum(["HONEYMOON", "FAMILY", "ADVENTURE", "LUXURY", "BUDGET", "GROUP", "PILGRIMAGE", "PREMIUM"]),
  duration: z.number().int().min(1, "Duration must be at least 1 day"),
  excerpt: z.string().default(""),
  description: z.string().default(""),
  coverImage: z.string().default(""),
  coverImageMobile: z.string().default(""),
  priceFrom: z.number().positive("Price must be positive"),
  minPersons: z.number().int().min(1).default(1),
  priceWas: nanToNull,
  discountPct: z.preprocess(
    (v) => (v === "" || v === null || v === undefined || (typeof v === "number" && isNaN(v)) ? null : Number(v)),
    z.number().int().min(0).max(100).nullable(),
  ),
  bestseller: z.boolean().default(false),
  published: z.boolean().default(false),
  // Which lead-capture forms show on the public tour-detail page.
  formMode: z.enum(["BOOKING_ONLY", "INQUIRY_ONLY", "BOTH"]).default("BOTH"),
  itinerary: z.array(itineraryDaySchema).default([]),
  inclusions: z.array(listItemSchema).default([]),
  exclusions: z.array(listItemSchema).default([]),
  gallery: z.array(galleryItemSchema).default([]),
  batches: z.array(batchSchema).default([]),
  metaTitle: z.string().default(""),
  metaDesc: z.string().default(""),
  ogImage: z.string().default(""),
  region: z.enum(["KASHMIR", "LADAKH"]).default("KASHMIR"),
  badge: z.string().default(""),
  badgeColor: z.enum(["green", "blue", "orange"]).default("green"),
  tagline: z.string().default(""),
  bestTime: z.string().default(""),
  difficulty: z.string().default(""),
  startCity: z.string().default(""),
  pickupDrop: z.string().default(""),
  transport: z.string().default(""),
  tourType: z.string().default(""),
  happyCount: z.preprocess(
    (v) => (v === "" || v === null || v === undefined || (typeof v === "number" && isNaN(v)) ? null : Number(v)),
    z.number().int().min(0).nullable(),
  ),
  highlights: z.array(listItemSchema).default([]),
  faqs: z.array(faqItemSchema).default([]),
  perfectFor: z.array(listItemSchema).default([]),
  notIdealFor: z.array(listItemSchema).default([]),
  whyItineraryWorks: z.string().default(""),
  accommodation: z.array(accommodationItemSchema).default([]),
  accommodationImage: z.string().default(""),
  meals: z.string().default(""),
  transportDetail: z.string().default(""),
  budgetBreakdown: z.array(budgetRowSchema).default([]),
  personalExpenses: z.array(expenseRowSchema).default([]),
  bestTimeDetail: z.string().default(""),
  thingsToCarry: z.array(packingItemSchema).default([]),
  localTravelTips: z.array(listItemSchema).default([]),
  importantNotes: z.array(noteItemSchema).default([]),
  whyVertexBlurb: z.string().default(""),
  ctaHeadline: z.string().default(""),
  ctaBody: z.string().default(""),
  ogTitle: z.string().default(""),
  ogDescription: z.string().default(""),
  relatedTours: z.array(relatedTourItemSchema).max(4, "Up to 4 related tours").default([]),
});

type PackageFormData = z.infer<typeof packageSchema>;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PackageFormDefaults {
  id?: string;
  title?: string;
  slug?: string;
  category?: string;
  duration?: number;
  excerpt?: string;
  description?: string;
  coverImage?: string;
  coverImageMobile?: string;
  priceFrom?: number;
  minPersons?: number;
  priceWas?: number | null;
  discountPct?: number | null;
  bestseller?: boolean;
  published?: boolean;
  formMode?: string;
  itinerary?: { day: number; title: string; description?: string; image?: string; meals?: string; stay?: string; travelTips?: string }[];
  inclusions?: string[];
  exclusions?: string[];
  gallery?: { url: string; alt?: string }[];
  batches?: { date: string; seats: number; price: string; status: string }[];
  metaTitle?: string;
  metaDesc?: string;
  ogImage?: string;
  activityIds?: string[];
  region?: string;
  badge?: string;
  badgeColor?: string;
  tagline?: string;
  bestTime?: string;
  difficulty?: string;
  startCity?: string;
  pickupDrop?: string;
  transport?: string;
  tourType?: string;
  happyCount?: number | null;
  highlights?: string[];
  faqs?: { question: string; answer: string }[];
  perfectFor?: string[];
  notIdealFor?: string[];
  whyItineraryWorks?: string;
  accommodation?: { location: string; description: string }[];
  accommodationImage?: string;
  meals?: string;
  transportDetail?: string;
  budgetBreakdown?: { category: string; perPerson: string; perFamily: string; note?: string }[];
  personalExpenses?: { activity: string; cost: string; mandatory: boolean }[];
  bestTimeDetail?: string;
  thingsToCarry?: { item: string; reason: string; mandatory: boolean }[];
  localTravelTips?: string[];
  importantNotes?: { text: string; reviewNote?: string }[];
  whyVertexBlurb?: string;
  ctaHeadline?: string;
  ctaBody?: string;
  ogTitle?: string;
  ogDescription?: string;
  relatedTours?: { tourId: string; ctaSentence: string }[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "HONEYMOON", label: "Honeymoon", color: "bg-pink-100 text-pink-700" },
  { value: "FAMILY", label: "Family", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  { value: "ADVENTURE", label: "Adventure", color: "bg-orange-500/15 text-orange-700 dark:text-orange-300" },
  { value: "LUXURY", label: "Luxury", color: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300" },
  { value: "BUDGET", label: "Budget", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  { value: "GROUP", label: "Group", color: "bg-purple-500/15 text-purple-700 dark:text-purple-300" },
  { value: "PILGRIMAGE", label: "Pilgrimage", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  { value: "PREMIUM", label: "Premium", color: "bg-slate-500/15 text-slate-700 dark:text-slate-300" },
];

const SECTIONS = [
  { id: "basics", label: "Basic Info", num: "1" },
  { id: "pricing", label: "Pricing", num: "2" },
  { id: "itinerary", label: "Itinerary & Gallery", num: "3" },
  { id: "departures", label: "Departures", num: "4" },
  { id: "details", label: "Trip Details", num: "5" },
  { id: "content", label: "Highlights & FAQs", num: "6" },
  { id: "fit", label: "Trip Fit", num: "7" },
  { id: "logistics", label: "Trip Logistics", num: "8" },
  { id: "budget", label: "Budget & Planning", num: "9" },
  { id: "notes", label: "Travel Tips & Notes", num: "10" },
  { id: "related", label: "Related Tours & Closing", num: "11" },
  { id: "seo", label: "SEO & Settings", num: "12" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-muted/50">
        <h3 className="font-display font-bold text-foreground text-sm">{title}</h3>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-foreground mb-1.5">
      {children}
      {required && <span className="text-accent ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-red-500 dark:text-red-400 text-xs mt-1">{message}</p>;
}

function TextInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full px-3.5 py-2.5 text-sm border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition placeholder:text-muted-foreground",
        className,
      )}
    />
  );
}

function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full px-3.5 py-2.5 text-sm border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition placeholder:text-muted-foreground resize-none",
        className,
      )}
    />
  );
}

function ImageUploadField({
  value,
  onChange,
  label,
  hint,
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "tours");
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      if (json.url) onChange(json.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {hint && <p className="text-[10px] text-muted-foreground mb-2">{hint}</p>}
      <div className="flex gap-2 mb-2">
        <TextInput
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... or upload a file below"
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2.5 border border-dashed border-border rounded-xl text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors shrink-0"
        >
          <Images className="w-3.5 h-3.5" />
          Gallery
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2.5 border border-dashed border-border rounded-xl text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors shrink-0"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
      <GalleryPicker open={pickerOpen} type="IMAGE" onSelect={onChange} onClose={() => setPickerOpen(false)} />
      {value && (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface PackageFormProps {
  defaults?: PackageFormDefaults;
  activityOptions?: LinkOption[];
  relatedTourOptions?: { id: string; title: string }[];
}

function toArrayField<T>(arr: T[] | undefined, map: (v: T) => unknown) {
  return (arr ?? []).map(map) as ReturnType<typeof map>[];
}

export function PackageForm({ defaults, activityOptions = [], relatedTourOptions = [] }: PackageFormProps) {
  const router = useRouter();
  const isEdit = Boolean(defaults?.id);
  const [activeSection, setActiveSection] = useState("basics");
  const [activityIds, setActivityIds] = useState<string[]>(defaults?.activityIds ?? []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PackageFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(packageSchema) as any,
    defaultValues: {
      title: defaults?.title ?? "",
      slug: defaults?.slug ?? "",
      category: (defaults?.category as PackageFormData["category"]) ?? "HONEYMOON",
      duration: defaults?.duration ?? 5,
      excerpt: defaults?.excerpt ?? "",
      description: defaults?.description ?? "",
      coverImage: defaults?.coverImage ?? "",
      coverImageMobile: defaults?.coverImageMobile ?? "",
      priceFrom: defaults?.priceFrom ?? 0,
      minPersons: defaults?.minPersons ?? 1,
      priceWas: defaults?.priceWas ?? null,
      discountPct: defaults?.discountPct ?? null,
      bestseller: defaults?.bestseller ?? false,
      published: defaults?.published ?? false,
      formMode: (defaults?.formMode as PackageFormData["formMode"]) ?? "BOTH",
      itinerary: (defaults?.itinerary ?? []).map((d) => ({
        day: d.day,
        title: d.title,
        description: d.description ?? "",
        image: d.image ?? "",
        meals: d.meals ?? "",
        stay: d.stay ?? "",
        travelTips: d.travelTips ?? "",
      })),
      inclusions: toArrayField(defaults?.inclusions, (v) => ({ value: v as string })) as { value: string }[],
      exclusions: toArrayField(defaults?.exclusions, (v) => ({ value: v as string })) as { value: string }[],
      gallery: (defaults?.gallery ?? []).map((g) => ({ url: g.url, alt: g.alt ?? "" })),
      batches: (defaults?.batches ?? []).map((b) => ({
        date: b.date,
        seats: b.seats,
        price: b.price,
        status: b.status as "open" | "filling" | "sold",
      })),
      metaTitle: defaults?.metaTitle ?? "",
      metaDesc: defaults?.metaDesc ?? "",
      ogImage: defaults?.ogImage ?? "",
      region: (defaults?.region as PackageFormData["region"]) ?? "KASHMIR",
      badge: defaults?.badge ?? "",
      badgeColor: (defaults?.badgeColor as PackageFormData["badgeColor"]) ?? "green",
      tagline: defaults?.tagline ?? "",
      bestTime: defaults?.bestTime ?? "",
      difficulty: defaults?.difficulty ?? "",
      startCity: defaults?.startCity ?? "",
      pickupDrop: defaults?.pickupDrop ?? "",
      transport: defaults?.transport ?? "",
      tourType: defaults?.tourType ?? "",
      happyCount: defaults?.happyCount ?? null,
      highlights: toArrayField(defaults?.highlights, (v) => ({ value: v as string })) as { value: string }[],
      faqs: (defaults?.faqs ?? []).map((f) => ({ question: f.question, answer: f.answer })),
      perfectFor: toArrayField(defaults?.perfectFor, (v) => ({ value: v as string })) as { value: string }[],
      notIdealFor: toArrayField(defaults?.notIdealFor, (v) => ({ value: v as string })) as { value: string }[],
      whyItineraryWorks: defaults?.whyItineraryWorks ?? "",
      accommodation: (defaults?.accommodation ?? []).map((a) => ({ location: a.location, description: a.description })),
      accommodationImage: defaults?.accommodationImage ?? "",
      meals: defaults?.meals ?? "",
      transportDetail: defaults?.transportDetail ?? "",
      budgetBreakdown: (defaults?.budgetBreakdown ?? []).map((b) => ({
        category: b.category,
        perPerson: b.perPerson,
        perFamily: b.perFamily,
        note: b.note ?? "",
      })),
      personalExpenses: (defaults?.personalExpenses ?? []).map((e) => ({
        activity: e.activity,
        cost: e.cost,
        mandatory: e.mandatory,
      })),
      bestTimeDetail: defaults?.bestTimeDetail ?? "",
      thingsToCarry: (defaults?.thingsToCarry ?? []).map((t) => ({
        item: t.item,
        reason: t.reason,
        mandatory: t.mandatory,
      })),
      localTravelTips: toArrayField(defaults?.localTravelTips, (v) => ({ value: v as string })) as { value: string }[],
      importantNotes: (defaults?.importantNotes ?? []).map((n) => ({ text: n.text, reviewNote: n.reviewNote ?? "" })),
      whyVertexBlurb: defaults?.whyVertexBlurb ?? "",
      ctaHeadline: defaults?.ctaHeadline ?? "",
      ctaBody: defaults?.ctaBody ?? "",
      ogTitle: defaults?.ogTitle ?? "",
      ogDescription: defaults?.ogDescription ?? "",
      relatedTours: (defaults?.relatedTours ?? []).map((r) => ({ tourId: r.tourId, ctaSentence: r.ctaSentence })),
    },
  });

  // ── Field arrays ───────────────────────────────────────────────────────────
  const { fields: itineraryFields, append: addDay, remove: removeDay } = useFieldArray({ control, name: "itinerary" });
  const { fields: inclusionFields, append: addInclusion, remove: removeInclusion } = useFieldArray({ control, name: "inclusions" });
  const { fields: exclusionFields, append: addExclusion, remove: removeExclusion } = useFieldArray({ control, name: "exclusions" });
  const { fields: galleryFields, append: addGalleryItem, remove: removeGalleryItem } = useFieldArray({ control, name: "gallery" });
  const { fields: batchFields, append: addBatch, remove: removeBatch } = useFieldArray({ control, name: "batches" });
  const { fields: highlightFields, append: addHighlight, remove: removeHighlight } = useFieldArray({ control, name: "highlights" });
  const { fields: faqFields, append: addFaq, remove: removeFaq } = useFieldArray({ control, name: "faqs" });
  const { fields: perfectForFields, append: addPerfectFor, remove: removePerfectFor } = useFieldArray({ control, name: "perfectFor" });
  const { fields: notIdealForFields, append: addNotIdealFor, remove: removeNotIdealFor } = useFieldArray({ control, name: "notIdealFor" });
  const { fields: accommodationFields, append: addAccommodation, remove: removeAccommodation } = useFieldArray({ control, name: "accommodation" });
  const { fields: budgetFields, append: addBudgetRow, remove: removeBudgetRow } = useFieldArray({ control, name: "budgetBreakdown" });
  const { fields: expenseFields, append: addExpenseRow, remove: removeExpenseRow } = useFieldArray({ control, name: "personalExpenses" });
  const { fields: packingFields, append: addPackingItem, remove: removePackingItem } = useFieldArray({ control, name: "thingsToCarry" });
  const { fields: tipFields, append: addTip, remove: removeTip } = useFieldArray({ control, name: "localTravelTips" });
  const { fields: noteFields, append: addNote, remove: removeNote } = useFieldArray({ control, name: "importantNotes" });
  const { fields: relatedFields, append: addRelated, remove: removeRelated } = useFieldArray({ control, name: "relatedTours" });
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);

  // ── Auto-slug from title (new tours only) ──────────────────────────────────
  const titleValue = watch("title");
  useEffect(() => {
    if (!isEdit) {
      const slug = titleValue
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", slug, { shouldValidate: false });
    }
  }, [titleValue, isEdit, setValue]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function onSubmit(data: PackageFormData) {
    const payload = {
      ...data,
      itinerary: JSON.stringify(data.itinerary),
      inclusions: JSON.stringify(data.inclusions.map((i) => i.value).filter(Boolean)),
      exclusions: JSON.stringify(data.exclusions.map((e) => e.value).filter(Boolean)),
      gallery: JSON.stringify(data.gallery.filter((g) => g.url).map((g) => ({ url: g.url, alt: g.alt }))),
      batches: JSON.stringify(data.batches),
      highlights: JSON.stringify(data.highlights.map((h) => h.value).filter(Boolean)),
      faqs: JSON.stringify(data.faqs.filter((f) => f.question.trim() || f.answer.trim())),
      perfectFor: stringifyList(data.perfectFor.map((p) => p.value).filter(Boolean)),
      notIdealFor: stringifyList(data.notIdealFor.map((n) => n.value).filter(Boolean)),
      accommodation: stringifyList(data.accommodation.filter((a) => a.location.trim() || a.description.trim())),
      budgetBreakdown: stringifyList(data.budgetBreakdown.filter((b) => b.category.trim())),
      personalExpenses: stringifyList(data.personalExpenses.filter((e) => e.activity.trim())),
      thingsToCarry: stringifyList(data.thingsToCarry.filter((t) => t.item.trim())),
      localTravelTips: stringifyList(data.localTravelTips.map((t) => t.value).filter(Boolean)),
      importantNotes: stringifyList(data.importantNotes.filter((n) => n.text.trim())),
      relatedTours: stringifyList(data.relatedTours.filter((r) => r.tourId && r.ctaSentence.trim())),
      priceWas: data.priceWas || null,
      discountPct: data.discountPct || null,
      happyCount: data.happyCount || null,
      activityIds,
    };

    const url = isEdit ? `/api/tours/${defaults!.id}` : "/api/tours";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      if (res.status === 403) {
        toast.error("You don't have permission to save packages. Contact your administrator.");
        return;
      }
      const json = (await res.json()) as { error?: unknown };
      const msg = typeof json.error === "string" ? json.error : "Save failed";
      toast.error(msg);
      return;
    }

    toast.success(isEdit ? "Package updated!" : "Package created!");
    router.push("/admin/packages");
    router.refresh();
  }

  async function handleSave(publish: boolean) {
    setValue("published", publish);
    await handleSubmit(onSubmit)();
  }

  // ── Watched values for sidebar preview ────────────────────────────────────
  const coverImage = watch("coverImage");
  const title = watch("title");
  const category = watch("category");
  const duration = watch("duration");
  const priceFrom = watch("priceFrom");
  const published = watch("published");
  const bestseller = watch("bestseller");

  const catInfo = CATEGORIES.find((c) => c.value === category);

  // ── Scroll-spy active section ──────────────────────────────────────────────
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex gap-6">
      {/* ── Section nav ───────────────────────────────────────────────────── */}
      <nav className="hidden xl:block w-44 shrink-0">
        <div className="sticky top-6 space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollTo(s.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-left transition-colors",
                activeSection === s.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                activeSection === s.id ? "bg-primary text-white" : "bg-muted text-muted-foreground",
              )}>
                {s.num}
              </span>
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Form sections ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* 1. Basic Info */}
        <SectionCard id="basics" title="1 · Basic Info">
          <div>
            <FieldLabel required>Package Title</FieldLabel>
            <TextInput {...register("title")} placeholder="e.g. Kashmir Honeymoon Escape" />
            <FieldError message={errors.title?.message} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Slug (URL)</FieldLabel>
              <TextInput {...register("slug")} placeholder="kashmir-honeymoon-escape" />
              <FieldError message={errors.slug?.message} />
            </div>
            <div>
              <FieldLabel required>Category</FieldLabel>
              <select
                {...register("category")}
                className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Duration (days)</FieldLabel>
              <TextInput {...register("duration", { valueAsNumber: true })} type="number" min={1} max={30} placeholder="7" />
              <FieldError message={errors.duration?.message} />
            </div>
            <div>
              <FieldLabel>Detail-page Forms</FieldLabel>
              <select
                {...register("formMode")}
                className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
              >
                <option value="BOTH">Enable Both (Booking + Inquiry)</option>
                <option value="BOOKING_ONLY">Enable Booking Only</option>
                <option value="INQUIRY_ONLY">Enable Inquiry Only</option>
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">Controls which forms visitors see on the tour page.</p>
            </div>
          </div>

          <div>
            <FieldLabel>Short Description (Excerpt)</FieldLabel>
            <TextArea {...register("excerpt")} rows={2} placeholder="A brief, compelling description for cards and listings..." />
          </div>

          <div>
            <FieldLabel>Full Description</FieldLabel>
            <p className="text-[10px] text-muted-foreground mb-1.5">HTML is accepted (bold, links, lists etc.)</p>
            <TextArea {...register("description")} rows={6} placeholder="Detailed description of the package..." />
          </div>

          <ImageUploadField
            value={coverImage}
            onChange={(url) => setValue("coverImage", url)}
            label="Cover Image"
            hint="Recommended: 1600×900px. Paste a URL or upload a file."
          />

          <ImageUploadField
            value={watch("coverImageMobile")}
            onChange={(url) => setValue("coverImageMobile", url)}
            label="Cover Image (Mobile)"
            hint="Recommended: 800×1000px (portrait). Shown on phones instead of the desktop Cover Image. Leave blank to reuse the desktop image."
          />
        </SectionCard>

        {/* 2. Pricing */}
        <SectionCard id="pricing" title="2 · Pricing">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel required>Price From (₹)</FieldLabel>
              <TextInput {...register("priceFrom", { valueAsNumber: true })} type="number" min={0} placeholder="25000" />
              <FieldError message={errors.priceFrom?.message} />
            </div>
            <div>
              <FieldLabel>Min. Persons</FieldLabel>
              <TextInput {...register("minPersons", { valueAsNumber: true })} type="number" min={1} max={50} placeholder="1" />
              <p className="text-[11px] text-muted-foreground mt-1">Minimum travellers required to book</p>
            </div>
            <div>
              <FieldLabel>Original Price (₹)</FieldLabel>
              <TextInput {...register("priceWas", { valueAsNumber: true })} type="number" min={0} placeholder="30000" />
            </div>
            <div>
              <FieldLabel>Discount (%)</FieldLabel>
              <TextInput {...register("discountPct", { valueAsNumber: true })} type="number" min={0} max={100} placeholder="15" />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setValue("bestseller", !bestseller)}
              className={cn(
                "w-10 h-5.5 rounded-full transition-colors relative cursor-pointer",
                bestseller ? "bg-accent" : "bg-muted",
              )}
            >
              <div className={cn("absolute top-0.5 w-4.5 h-4.5 rounded-full bg-card shadow-sm transition-transform", bestseller ? "translate-x-4.5" : "translate-x-0.5")} />
            </div>
            <span className="text-sm font-medium text-foreground">Mark as Bestseller</span>
          </label>
        </SectionCard>

        {/* 3. Itinerary & Gallery */}
        <SectionCard id="itinerary" title="3 · Itinerary & Gallery">
          {/* Itinerary builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <FieldLabel>Day-by-Day Itinerary</FieldLabel>
              <button
                type="button"
                onClick={() => addDay({ day: itineraryFields.length + 1, title: "", description: "", image: "", meals: "", stay: "", travelTips: "" })}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Day
              </button>
            </div>

            {itineraryFields.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-xl text-muted-foreground text-xs">
                No days yet — click &ldquo;Add Day&rdquo; to build the itinerary
              </div>
            ) : (
              <div className="space-y-3">
                {itineraryFields.map((field, i) => (
                  <div key={field.id} className="border border-border rounded-xl p-4 bg-muted/50">
                    <div className="flex items-center gap-3 mb-3">
                      <GripVertical className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                      <span className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <TextInput
                        {...register(`itinerary.${i}.title`)}
                        placeholder={`Day ${i + 1} — e.g. Arrival in Srinagar`}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeDay(i)}
                        className="text-muted-foreground/60 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <TextArea
                      {...register(`itinerary.${i}.description`)}
                      rows={2}
                      placeholder="What happens on this day..."
                      className="ml-11"
                    />
                    <div className="ml-11 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <TextInput {...register(`itinerary.${i}.meals`)} placeholder="Meals — e.g. Breakfast & Dinner" />
                      <TextInput {...register(`itinerary.${i}.stay`)} placeholder="Stay — e.g. Deluxe Hotel in Pahalgam" />
                    </div>
                    <TextArea
                      {...register(`itinerary.${i}.travelTips`)}
                      rows={2}
                      placeholder="Travel tips for this day (optional)..."
                      className="ml-11 mt-2"
                    />
                    <div className="ml-11 mt-2">
                      <ImageUploadField
                        value={watch(`itinerary.${i}.image`)}
                        onChange={(url) => setValue(`itinerary.${i}.image`, url)}
                        label="Day Image (optional)"
                      />
                    </div>
                    <input type="hidden" {...register(`itinerary.${i}.day`)} value={i + 1} />
                    <FieldError message={errors.itinerary?.[i]?.title?.message} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inclusions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <FieldLabel>Inclusions</FieldLabel>
              <button
                type="button"
                onClick={() => addInclusion({ value: "" })}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {inclusionFields.map((field, i) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <TextInput {...register(`inclusions.${i}.value`)} placeholder="e.g. Airport transfers" className="flex-1" />
                  <button type="button" onClick={() => removeInclusion(i)} className="text-muted-foreground/60 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {inclusionFields.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">No inclusions added yet.</p>
              )}
            </div>
          </div>

          {/* Exclusions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <FieldLabel>Exclusions</FieldLabel>
              <button
                type="button"
                onClick={() => addExclusion({ value: "" })}
                className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-500 dark:text-red-400 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {exclusionFields.map((field, i) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <TextInput {...register(`exclusions.${i}.value`)} placeholder="e.g. International flights" className="flex-1" />
                  <button type="button" onClick={() => removeExclusion(i)} className="text-muted-foreground/60 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {exclusionFields.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">No exclusions added yet.</p>
              )}
            </div>
          </div>

          {/* Gallery */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <FieldLabel>Gallery Images</FieldLabel>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setGalleryPickerOpen(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <Images className="w-3.5 h-3.5" /> From Gallery
                </button>
                <button
                  type="button"
                  onClick={() => addGalleryItem({ url: "", alt: "" })}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Image
                </button>
              </div>
            </div>
            {galleryFields.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No gallery images added yet.</p>
            ) : (
              <div className="space-y-2">
                {galleryFields.map((field, i) => {
                  const url = watch(`gallery.${i}.url`);
                  return (
                    <div key={field.id} className="flex gap-2 items-start">
                      <div className="relative w-12 h-9 rounded-lg overflow-hidden bg-muted shrink-0 mt-0.5">
                        {url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-muted-foreground/60 absolute inset-0 m-auto" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <TextInput {...register(`gallery.${i}.url`)} type="url" placeholder="Image URL (https://...)" />
                        <TextInput {...register(`gallery.${i}.alt`)} placeholder='Alt text — e.g. "Family shikara ride on Dal Lake"' className="text-xs" />
                      </div>
                      <button type="button" onClick={() => removeGalleryItem(i)} className="text-muted-foreground/60 hover:text-red-400 transition-colors mt-0.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <GalleryPicker
            open={galleryPickerOpen}
            type="IMAGE"
            title="Add images to this tour's gallery"
            onSelect={(url) => addGalleryItem({ url, alt: "" })}
            onClose={() => setGalleryPickerOpen(false)}
          />
        </SectionCard>

        {/* 4. Departures */}
        <SectionCard id="departures" title="4 · Departures">
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs text-muted-foreground max-w-prose">
              Departure dates shown on the tour page. Each batch emits an Event schema — Google can display availability directly in search results.
            </p>
            <button
              type="button"
              onClick={() => addBatch({ date: "", seats: 10, price: "", status: "open" })}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Departure
            </button>
          </div>
          {batchFields.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-4">No departures yet — click &ldquo;Add Departure&rdquo; to add one.</p>
          ) : (
            <div className="space-y-3">
              {batchFields.map((field, i) => (
                <div key={field.id} className="border border-border rounded-xl p-4 bg-muted/50 grid grid-cols-[1fr_80px_1fr_140px_36px] gap-3 items-start">
                  <div>
                    <FieldLabel>Date</FieldLabel>
                    <TextInput {...register(`batches.${i}.date`)} type="date" />
                    {errors.batches?.[i]?.date && <FieldError message={errors.batches[i]?.date?.message} />}
                  </div>
                  <div>
                    <FieldLabel>Seats</FieldLabel>
                    <TextInput {...register(`batches.${i}.seats`, { valueAsNumber: true })} type="number" min={1} />
                    {errors.batches?.[i]?.seats && <FieldError message={errors.batches[i]?.seats?.message} />}
                  </div>
                  <div>
                    <FieldLabel>Price</FieldLabel>
                    <TextInput {...register(`batches.${i}.price`)} placeholder="e.g. ₹25,000" />
                    {errors.batches?.[i]?.price && <FieldError message={errors.batches[i]?.price?.message} />}
                  </div>
                  <div>
                    <FieldLabel>Status</FieldLabel>
                    <select
                      {...register(`batches.${i}.status`)}
                      className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                    >
                      <option value="open">Open</option>
                      <option value="filling">Filling Fast</option>
                      <option value="sold">Sold Out</option>
                    </select>
                  </div>
                  <div className="pt-5">
                    <button
                      type="button"
                      onClick={() => removeBatch(i)}
                      className="p-1.5 rounded text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* 5. Trip Details */}
        <SectionCard id="details" title="5 · Trip Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Badge Text</FieldLabel>
              <TextInput {...register("badge")} placeholder="e.g. BESTSELLER" />
            </div>
            <div>
              <FieldLabel>Badge Color</FieldLabel>
              <select
                {...register("badgeColor")}
                className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
              >
                <option value="green">Green</option>
                <option value="blue">Blue</option>
                <option value="orange">Orange</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Region</FieldLabel>
              <select
                {...register("region")}
                className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
              >
                <option value="KASHMIR">Kashmir</option>
                <option value="LADAKH">Ladakh</option>
              </select>
            </div>
            <div>
              <FieldLabel>Tagline</FieldLabel>
              <TextInput {...register("tagline")} placeholder="e.g. A romantic escape through the paradise on earth" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Best Time to Visit</FieldLabel>
              <TextInput {...register("bestTime")} placeholder="e.g. Apr – Oct" />
            </div>
            <div>
              <FieldLabel>Difficulty</FieldLabel>
              <TextInput {...register("difficulty")} placeholder="e.g. Easy, Moderate, Challenging" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Start City</FieldLabel>
              <TextInput {...register("startCity")} placeholder="e.g. Srinagar" />
            </div>
            <div>
              <FieldLabel>Pickup / Drop</FieldLabel>
              <TextInput {...register("pickupDrop")} placeholder="e.g. Srinagar Airport" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Transport</FieldLabel>
              <TextInput {...register("transport")} placeholder="e.g. Private Cab" />
            </div>
            <div>
              <FieldLabel>Tour Type</FieldLabel>
              <TextInput {...register("tourType")} placeholder="e.g. Private Tour" />
            </div>
          </div>

          <div>
            <FieldLabel>Happy Travellers Count</FieldLabel>
            <TextInput {...register("happyCount", { valueAsNumber: true })} type="number" min={0} placeholder="e.g. 12000" />
            <p className="text-[10px] text-muted-foreground mt-1">Shown as “12,000+ Happy Travellers” on the tour page. Leave blank to hide.</p>
          </div>
        </SectionCard>

        {/* 6. Highlights & FAQs */}
        <SectionCard id="content" title="6 · Highlights & FAQs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <FieldLabel>Highlights</FieldLabel>
              <button
                type="button"
                onClick={() => addHighlight({ value: "" })}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Highlight
              </button>
            </div>
            <div className="space-y-2">
              {highlightFields.map((field, i) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <Star className="w-4 h-4 text-accent shrink-0" />
                  <TextInput {...register(`highlights.${i}.value`)} placeholder="e.g. ❤️ Romantic Houseboat" className="flex-1" />
                  <button type="button" onClick={() => removeHighlight(i)} className="text-muted-foreground/60 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {highlightFields.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">No highlights added yet.</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <FieldLabel>FAQs</FieldLabel>
              <button
                type="button"
                onClick={() => addFaq({ question: "", answer: "" })}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add FAQ
              </button>
            </div>
            {faqFields.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No FAQs added yet.</p>
            ) : (
              <div className="space-y-3">
                {faqFields.map((field, i) => (
                  <div key={field.id} className="border border-border rounded-xl p-4 bg-muted/50 flex items-start gap-3">
                    <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-2.5" />
                    <div className="flex-1 space-y-2">
                      <TextInput {...register(`faqs.${i}.question`)} placeholder="Question — e.g. Is this package customisable?" />
                      <TextArea {...register(`faqs.${i}.answer`)} rows={2} placeholder="Answer..." />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFaq(i)}
                      className="text-muted-foreground/60 hover:text-red-400 transition-colors shrink-0 mt-2.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        {/* 7. Trip Fit */}
        <SectionCard id="fit" title="7 · Trip Fit">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <FieldLabel>Perfect For</FieldLabel>
                <button
                  type="button"
                  onClick={() => addPerfectFor({ value: "" })}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>
              <div className="space-y-2">
                {perfectForFields.map((field, i) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <TextInput {...register(`perfectFor.${i}.value`)} placeholder="e.g. Multi-generational families" className="flex-1" />
                    <button type="button" onClick={() => removePerfectFor(i)} className="text-muted-foreground/60 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {perfectForFields.length === 0 && <p className="text-xs text-muted-foreground py-2">Not set yet.</p>}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <FieldLabel>Not Ideal For</FieldLabel>
                <button
                  type="button"
                  onClick={() => addNotIdealFor({ value: "" })}
                  className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-500 dark:text-red-400 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>
              <div className="space-y-2">
                {notIdealForFields.map((field, i) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <TextInput {...register(`notIdealFor.${i}.value`)} placeholder="e.g. Budget solo backpackers" className="flex-1" />
                    <button type="button" onClick={() => removeNotIdealFor(i)} className="text-muted-foreground/60 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {notIdealForFields.length === 0 && <p className="text-xs text-muted-foreground py-2">Not set yet.</p>}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 8. Trip Logistics */}
        <SectionCard id="logistics" title="8 · Trip Logistics">
          <div>
            <FieldLabel>Why This Itinerary Works</FieldLabel>
            <p className="text-[10px] text-muted-foreground mb-1.5">HTML is accepted. Explains the route/pacing logic — builds trust before the day-by-day.</p>
            <TextArea {...register("whyItineraryWorks")} rows={4} placeholder="Why this itinerary is paced/routed the way it is..." />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <FieldLabel>Accommodation</FieldLabel>
              <button
                type="button"
                onClick={() => addAccommodation({ location: "", description: "" })}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Location
              </button>
            </div>
            {accommodationFields.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No accommodation entries yet.</p>
            ) : (
              <div className="space-y-3">
                {accommodationFields.map((field, i) => (
                  <div key={field.id} className="border border-border rounded-xl p-4 bg-muted/50 flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <TextInput {...register(`accommodation.${i}.location`)} placeholder="Location — e.g. Pahalgam Stay" />
                      <TextArea {...register(`accommodation.${i}.description`)} rows={2} placeholder="What travellers can expect here..." />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAccommodation(i)}
                      className="text-muted-foreground/60 hover:text-red-400 transition-colors shrink-0 mt-2.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <ImageUploadField
            value={watch("accommodationImage")}
            onChange={(url) => setValue("accommodationImage", url)}
            label="Accommodation Image"
            hint="Recommended: 1200×900px. Shown alongside the Accommodation section on the tour page."
          />

          <div>
            <FieldLabel>Meals</FieldLabel>
            <p className="text-[10px] text-muted-foreground mb-1.5">HTML is accepted.</p>
            <TextArea {...register("meals")} rows={3} placeholder="Meal plan policy — what's included, what's not, and why..." />
          </div>

          <div>
            <FieldLabel>Transport Detail</FieldLabel>
            <p className="text-[10px] text-muted-foreground mb-1.5">HTML is accepted. Vehicle/local-union-cab policy — richer than the short Transport quick-fact.</p>
            <TextArea {...register("transportDetail")} rows={3} placeholder="Transport and local sightseeing rules..." />
          </div>
        </SectionCard>

        {/* 9. Budget & Planning */}
        <SectionCard id="budget" title="9 · Budget & Planning">
          <div>
            <div className="flex items-center justify-between mb-3">
              <FieldLabel>Estimated Total Trip Budget</FieldLabel>
              <button
                type="button"
                onClick={() => addBudgetRow({ category: "", perPerson: "", perFamily: "", note: "" })}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>
            {budgetFields.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No budget rows yet.</p>
            ) : (
              <div className="space-y-2">
                {budgetFields.map((field, i) => (
                  <div key={field.id} className="border border-border rounded-xl p-3 bg-muted/50 grid grid-cols-[1fr_1fr_1fr_1fr_32px] gap-2 items-start">
                    <TextInput {...register(`budgetBreakdown.${i}.category`)} placeholder="Expense category" />
                    <TextInput {...register(`budgetBreakdown.${i}.perPerson`)} placeholder="Per person" />
                    <TextInput {...register(`budgetBreakdown.${i}.perFamily`)} placeholder="Per family" />
                    <TextInput {...register(`budgetBreakdown.${i}.note`)} placeholder="Note" />
                    <button type="button" onClick={() => removeBudgetRow(i)} className="text-muted-foreground/60 hover:text-red-400 transition-colors mt-2.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <FieldLabel>Estimated Personal Expenses</FieldLabel>
              <button
                type="button"
                onClick={() => addExpenseRow({ activity: "", cost: "", mandatory: false })}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>
            {expenseFields.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No expense rows yet.</p>
            ) : (
              <div className="space-y-2">
                {expenseFields.map((field, i) => {
                  const mandatory = watch(`personalExpenses.${i}.mandatory`);
                  return (
                    <div key={field.id} className="border border-border rounded-xl p-3 bg-muted/50 grid grid-cols-[1fr_1fr_auto_32px] gap-2 items-center">
                      <TextInput {...register(`personalExpenses.${i}.activity`)} placeholder="Activity / expense" />
                      <TextInput {...register(`personalExpenses.${i}.cost`)} placeholder="Approx. cost" />
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={mandatory}
                          onChange={(e) => setValue(`personalExpenses.${i}.mandatory`, e.target.checked)}
                          className="rounded border-border"
                        />
                        Mandatory
                      </label>
                      <button type="button" onClick={() => removeExpenseRow(i)} className="text-muted-foreground/60 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <FieldLabel>Best Time to Visit — Detail</FieldLabel>
            <p className="text-[10px] text-muted-foreground mb-1.5">HTML is accepted. Full seasonal breakdown — the short Best Time field (Trip Details) stays for the sidebar quick-fact.</p>
            <TextArea {...register("bestTimeDetail")} rows={4} placeholder="Season-by-season breakdown..." />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <FieldLabel>Things to Carry</FieldLabel>
              <button
                type="button"
                onClick={() => addPackingItem({ item: "", reason: "", mandatory: false })}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            {packingFields.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No packing items yet.</p>
            ) : (
              <div className="space-y-2">
                {packingFields.map((field, i) => {
                  const mandatory = watch(`thingsToCarry.${i}.mandatory`);
                  return (
                    <div key={field.id} className="border border-border rounded-xl p-3 bg-muted/50 grid grid-cols-[1fr_1fr_auto_32px] gap-2 items-center">
                      <TextInput {...register(`thingsToCarry.${i}.item`)} placeholder="Item" />
                      <TextInput {...register(`thingsToCarry.${i}.reason`)} placeholder="Why it's needed" />
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={mandatory}
                          onChange={(e) => setValue(`thingsToCarry.${i}.mandatory`, e.target.checked)}
                          className="rounded border-border"
                        />
                        Mandatory
                      </label>
                      <button type="button" onClick={() => removePackingItem(i)} className="text-muted-foreground/60 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SectionCard>

        {/* 10. Travel Tips & Notes */}
        <SectionCard id="notes" title="10 · Travel Tips & Notes">
          <div>
            <div className="flex items-center justify-between mb-3">
              <FieldLabel>Local Travel Tips</FieldLabel>
              <button
                type="button"
                onClick={() => addTip({ value: "" })}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Tip
              </button>
            </div>
            <div className="space-y-2">
              {tipFields.map((field, i) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <TextInput {...register(`localTravelTips.${i}.value`)} placeholder="e.g. Verify your SIM is postpaid before arrival" className="flex-1" />
                  <button type="button" onClick={() => removeTip(i)} className="text-muted-foreground/60 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {tipFields.length === 0 && <p className="text-xs text-muted-foreground py-2">No tips added yet.</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <FieldLabel>Important Notes</FieldLabel>
              <button
                type="button"
                onClick={() => addNote({ text: "", reviewNote: "" })}
                className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-500 dark:text-red-400 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Note
              </button>
            </div>
            {noteFields.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No important notes yet.</p>
            ) : (
              <div className="space-y-3">
                {noteFields.map((field, i) => (
                  <div key={field.id} className="border border-border rounded-xl p-4 bg-muted/50 flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <TextArea {...register(`importantNotes.${i}.text`)} rows={2} placeholder="Warning / regulation the traveller should know..." />
                      <TextInput {...register(`importantNotes.${i}.reviewNote`)} placeholder="Internal review note (optional) — e.g. re-check seasonally" className="text-xs" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNote(i)}
                      className="text-muted-foreground/60 hover:text-red-400 transition-colors shrink-0 mt-2.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        {/* 11. Related Tours & Closing */}
        <SectionCard id="related" title="11 · Related Tours & Closing">
          <div>
            <div className="flex items-center justify-between mb-3">
              <FieldLabel>Related Tours</FieldLabel>
              {relatedFields.length < 4 && (
                <button
                  type="button"
                  onClick={() => addRelated({ tourId: "", ctaSentence: "" })}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Related Tour
                </button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">Up to 4 curated pairings. Each links to another tour with a custom CTA sentence — not an automatic &ldquo;more like this&rdquo; feed.</p>
            {relatedFields.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No related tours added yet.</p>
            ) : (
              <div className="space-y-2">
                {relatedFields.map((field, i) => (
                  <div key={field.id} className="border border-border rounded-xl p-3 bg-muted/50 grid grid-cols-[1fr_2fr_32px] gap-2 items-start">
                    <select
                      {...register(`relatedTours.${i}.tourId`)}
                      className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                    >
                      <option value="">Select a tour…</option>
                      {relatedTourOptions.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                    <TextInput {...register(`relatedTours.${i}.ctaSentence`)} placeholder='CTA sentence — e.g. "Looking for something more exclusive? Explore our Premium Kashmir Tour Package."' />
                    <button type="button" onClick={() => removeRelated(i)} className="text-muted-foreground/60 hover:text-red-400 transition-colors mt-2.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <FieldLabel>Why Vertex Kashmir Holidays</FieldLabel>
            <p className="text-[10px] text-muted-foreground mb-1.5">HTML is accepted. Per-tour trust paragraph shown near the closing CTA.</p>
            <TextArea {...register("whyVertexBlurb")} rows={3} placeholder="Why travellers should book this trip with us..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>CTA Headline</FieldLabel>
              <TextInput {...register("ctaHeadline")} placeholder="e.g. Plan Your Spiritual Journey to Katra & Kashmir" />
            </div>
          </div>
          <div>
            <FieldLabel>CTA Body</FieldLabel>
            <p className="text-[10px] text-muted-foreground mb-1.5">HTML is accepted.</p>
            <TextArea {...register("ctaBody")} rows={3} placeholder="Closing paragraph inviting the visitor to get in touch..." />
          </div>
        </SectionCard>

        {/* 12. SEO & Settings */}
        <SectionCard id="seo" title="12 · SEO & Settings">
          <div>
            <FieldLabel>Meta Title</FieldLabel>
            <TextInput {...register("metaTitle")} placeholder="SEO page title (60 chars ideal)" />
            <p className="text-[10px] text-muted-foreground mt-1">Leave blank to auto-generate from tour title.</p>
          </div>
          <div>
            <FieldLabel>Meta Description</FieldLabel>
            <TextArea {...register("metaDesc")} rows={2} placeholder="SEO description (155 chars ideal)" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>OG Title</FieldLabel>
              <TextInput {...register("ogTitle")} placeholder="Leave blank to reuse Meta Title" />
            </div>
            <div>
              <FieldLabel>OG Description</FieldLabel>
              <TextInput {...register("ogDescription")} placeholder="Leave blank to reuse Meta Description" />
            </div>
          </div>
          <ImageUploadField
            value={watch("ogImage")}
            onChange={(url) => setValue("ogImage", url)}
            label="OG / Social Share Image"
            hint="Recommended: 1200×630px"
          />

          <div>
            <FieldLabel>Things to Do (Activities)</FieldLabel>
            <p className="text-[10px] text-muted-foreground mb-2">Activities shown on this tour&apos;s page. Manage activities in the Activities module.</p>
            <LinkChecklist title="Activities" options={activityOptions} value={activityIds} onChange={setActivityIds} />
          </div>
        </SectionCard>
      </div>

      {/* ── Right sidebar ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-64 shrink-0 gap-4 sticky top-6 self-start">
        {/* Preview card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="relative h-36 bg-muted">
            {coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60">
                <ImageIcon className="w-8 h-8 mb-1" />
                <p className="text-xs">No cover image</p>
              </div>
            )}
            {catInfo && (
              <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${catInfo.color}`}>
                {catInfo.label}
              </span>
            )}
          </div>
          <div className="p-3">
            <p className="font-display font-bold text-foreground text-sm leading-tight line-clamp-2 mb-1">
              {title || "Package title will appear here"}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{duration} days</span>
              <span className="font-bold text-foreground">
                {priceFrom ? `₹${Number(priceFrom).toLocaleString("en-IN")}` : "₹0"}
              </span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4 space-y-3">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">Status</p>

          <label className="flex items-center justify-between cursor-pointer select-none">
            <span className="text-sm text-muted-foreground">Published</span>
            <div
              onClick={() => setValue("published", !published)}
              className={cn(
                "w-9 h-5 rounded-full transition-colors relative cursor-pointer",
                published ? "bg-primary" : "bg-muted",
              )}
            >
              <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-card shadow-sm transition-transform", published ? "translate-x-4" : "translate-x-0.5")} />
            </div>
          </label>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Visibility</span>
            <span className={cn("font-semibold", published ? "text-primary" : "text-muted-foreground")}>
              {published ? "● Live" : "○ Draft"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSubmitting}
            variant="outline"
            className="w-full border-border text-foreground font-semibold"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Draft
          </Button>
          <Button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-sm shadow-primary/25"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
            Publish Package
          </Button>
          <button
            type="button"
            onClick={() => router.push("/admin/packages")}
            className="w-full text-xs text-muted-foreground hover:text-muted-foreground transition-colors py-1"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Mobile bottom actions — bottom-20 clears the fixed bottom tab bar (MobileBottomTabs) */}
      <div className="lg:hidden fixed bottom-20 left-0 right-0 bg-card border-t border-border p-4 flex gap-3 z-40">
        <Button
          type="button"
          onClick={() => handleSave(false)}
          disabled={isSubmitting}
          variant="outline"
          className="flex-1 border-border font-semibold"
        >
          Save Draft
        </Button>
        <Button
          type="button"
          onClick={() => handleSave(true)}
          disabled={isSubmitting}
          className="flex-1 bg-primary text-white font-bold"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
          Publish
        </Button>
      </div>
    </form>
  );
}
