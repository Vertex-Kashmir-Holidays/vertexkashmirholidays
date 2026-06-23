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
  CheckCircle2, XCircle, Save,
} from "lucide-react";
import { GalleryPicker } from "@/components/admin/pages/GalleryPicker";
import { LinkChecklist, type LinkOption } from "@/components/admin/activities/LinkChecklist";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Schema ────────────────────────────────────────────────────────────────────

const itineraryDaySchema = z.object({
  day: z.number().int().min(1),
  title: z.string().min(1, "Title required"),
  description: z.string().default(""),
});

const listItemSchema = z.object({ value: z.string() });
const galleryItemSchema = z.object({ url: z.string() });

const nanToNull = z.preprocess(
  (v) => (v === "" || v === null || v === undefined || (typeof v === "number" && isNaN(v)) ? null : Number(v)),
  z.number().positive().nullable(),
);

const packageSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  category: z.enum(["HONEYMOON", "FAMILY", "ADVENTURE", "LUXURY"]),
  duration: z.number().int().min(1, "Duration must be at least 1 day"),
  excerpt: z.string().default(""),
  description: z.string().default(""),
  coverImage: z.string().default(""),
  priceFrom: z.number().positive("Price must be positive"),
  priceWas: nanToNull,
  discountPct: z.preprocess(
    (v) => (v === "" || v === null || v === undefined || (typeof v === "number" && isNaN(v)) ? null : Number(v)),
    z.number().int().min(0).max(100).nullable(),
  ),
  bestseller: z.boolean().default(false),
  published: z.boolean().default(false),
  itinerary: z.array(itineraryDaySchema).default([]),
  inclusions: z.array(listItemSchema).default([]),
  exclusions: z.array(listItemSchema).default([]),
  gallery: z.array(galleryItemSchema).default([]),
  metaTitle: z.string().default(""),
  metaDesc: z.string().default(""),
  ogImage: z.string().default(""),
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
  priceFrom?: number;
  priceWas?: number | null;
  discountPct?: number | null;
  bestseller?: boolean;
  published?: boolean;
  itinerary?: { day: number; title: string; description: string }[];
  inclusions?: string[];
  exclusions?: string[];
  gallery?: string[];
  metaTitle?: string;
  metaDesc?: string;
  ogImage?: string;
  activityIds?: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "HONEYMOON", label: "Honeymoon", color: "bg-pink-100 text-pink-700" },
  { value: "FAMILY", label: "Family", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  { value: "ADVENTURE", label: "Adventure", color: "bg-orange-500/15 text-orange-700 dark:text-orange-300" },
  { value: "LUXURY", label: "Luxury", color: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300" },
];

const SECTIONS = [
  { id: "basics", label: "Basic Info", num: "1" },
  { id: "pricing", label: "Pricing", num: "2" },
  { id: "itinerary", label: "Itinerary & Gallery", num: "3" },
  { id: "seo", label: "SEO & Settings", num: "4" },
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
          accept="image/*"
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
}

function toArrayField<T>(arr: T[] | undefined, map: (v: T) => unknown) {
  return (arr ?? []).map(map) as ReturnType<typeof map>[];
}

export function PackageForm({ defaults, activityOptions = [] }: PackageFormProps) {
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
      priceFrom: defaults?.priceFrom ?? 0,
      priceWas: defaults?.priceWas ?? null,
      discountPct: defaults?.discountPct ?? null,
      bestseller: defaults?.bestseller ?? false,
      published: defaults?.published ?? false,
      itinerary: (defaults?.itinerary ?? []).map((d) => ({
        day: d.day,
        title: d.title,
        description: d.description,
      })),
      inclusions: toArrayField(defaults?.inclusions, (v) => ({ value: v as string })) as { value: string }[],
      exclusions: toArrayField(defaults?.exclusions, (v) => ({ value: v as string })) as { value: string }[],
      gallery: toArrayField(defaults?.gallery, (v) => ({ url: v as string })) as { url: string }[],
      metaTitle: defaults?.metaTitle ?? "",
      metaDesc: defaults?.metaDesc ?? "",
      ogImage: defaults?.ogImage ?? "",
    },
  });

  // ── Field arrays ───────────────────────────────────────────────────────────
  const { fields: itineraryFields, append: addDay, remove: removeDay } = useFieldArray({ control, name: "itinerary" });
  const { fields: inclusionFields, append: addInclusion, remove: removeInclusion } = useFieldArray({ control, name: "inclusions" });
  const { fields: exclusionFields, append: addExclusion, remove: removeExclusion } = useFieldArray({ control, name: "exclusions" });
  const { fields: galleryFields, append: addGalleryItem, remove: removeGalleryItem } = useFieldArray({ control, name: "gallery" });
  // Gallery picker for appending existing media to the tour's gallery array.
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
      gallery: JSON.stringify(data.gallery.map((g) => g.url).filter(Boolean)),
      priceWas: data.priceWas || null,
      discountPct: data.discountPct || null,
      activityIds,
    };

    const url = isEdit ? `/api/tours/${defaults!.id}` : "/api/tours";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await res.json()) as { error?: unknown };
    if (!res.ok) {
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

          <div>
            <FieldLabel required>Duration (days)</FieldLabel>
            <TextInput {...register("duration", { valueAsNumber: true })} type="number" min={1} max={30} placeholder="7" className="max-w-xs" />
            <FieldError message={errors.duration?.message} />
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
                onClick={() => addDay({ day: itineraryFields.length + 1, title: "", description: "" })}
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
                  onClick={() => addGalleryItem({ url: "" })}
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
                    <div key={field.id} className="flex gap-2 items-center">
                      <div className="relative w-12 h-9 rounded-lg overflow-hidden bg-muted shrink-0">
                        {url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-muted-foreground/60 absolute inset-0 m-auto" />
                        )}
                      </div>
                      <TextInput {...register(`gallery.${i}.url`)} type="url" placeholder="https://..." className="flex-1" />
                      <button type="button" onClick={() => removeGalleryItem(i)} className="text-muted-foreground/60 hover:text-red-400 transition-colors">
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
            onSelect={(url) => addGalleryItem({ url })}
            onClose={() => setGalleryPickerOpen(false)}
          />
        </SectionCard>

        {/* 4. SEO & Settings */}
        <SectionCard id="seo" title="4 · SEO & Settings">
          <div>
            <FieldLabel>Meta Title</FieldLabel>
            <TextInput {...register("metaTitle")} placeholder="SEO page title (60 chars ideal)" />
            <p className="text-[10px] text-muted-foreground mt-1">Leave blank to auto-generate from tour title.</p>
          </div>
          <div>
            <FieldLabel>Meta Description</FieldLabel>
            <TextArea {...register("metaDesc")} rows={2} placeholder="SEO description (155 chars ideal)" />
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

      {/* Mobile bottom actions */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex gap-3 z-40">
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
