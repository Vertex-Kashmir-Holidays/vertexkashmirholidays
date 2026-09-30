"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Upload, Images } from "lucide-react";
import { GalleryPicker } from "@/components/admin/pages/GalleryPicker";

// Admin form for a Tour Collection (a top-level SEO/destination landing page
// such as /kashmir-tour-packages). Tours are assigned to collections from the
// Tour (Package) form, not here — one place owns the relationship.

const schema = z.object({
  name: z.string().trim().min(3, "Name is required"),
  slug: z
    .string()
    .trim()
    .min(3)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers, hyphens only"),
  intro: z.string().optional(),
  content: z.string().optional(),
  heroImage: z.string().optional(),
  heroImageMobile: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  ogImage: z.string().optional(),
  published: z.boolean(),
  sortOrder: z.coerce.number().int(),
});

type FormData = z.infer<typeof schema>;
type ImageField = "heroImage" | "heroImageMobile" | "ogImage";

export interface CollectionFormDefaults {
  id?: string;
  name?: string;
  slug?: string;
  intro?: string;
  content?: string;
  heroImage?: string;
  heroImageMobile?: string;
  metaTitle?: string;
  metaDesc?: string;
  ogImage?: string;
  published?: boolean;
  sortOrder?: number;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1";
const cardCls = "bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4";

function ImageInput({
  label,
  hint,
  field,
  value,
  registration,
  uploading,
  onPick,
  onUpload,
}: {
  label: string;
  hint?: string;
  field: ImageField;
  value?: string;
  registration: UseFormRegisterReturn;
  uploading: boolean;
  onPick: (field: ImageField) => void;
  onUpload: (file: File, field: ImageField) => void;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {hint && <p className="text-[12px] text-muted-foreground mb-1">{hint}</p>}
      <div className="flex gap-3">
        <input
          {...registration}
          className={`flex-1 ${inputCls}`}
          placeholder="https://... or /uploads/..."
        />
        <button
          type="button"
          onClick={() => onPick(field)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Images className="w-3.5 h-3.5" />
          Gallery
        </button>
        <label
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-border cursor-pointer transition-colors ${uploading ? "opacity-50" : "hover:border-primary hover:text-primary"}`}
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          Upload
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0], field)}
          />
        </label>
      </div>
      {value && (
        <div className="relative mt-3 h-36 rounded-xl overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={`${label} preview`} className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

export function CollectionForm({ defaults }: { defaults?: CollectionFormDefaults }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [picker, setPicker] = useState<ImageField | null>(null);
  const isEdit = !!defaults?.id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: defaults?.name ?? "",
      slug: defaults?.slug ?? "",
      intro: defaults?.intro ?? "",
      content: defaults?.content ?? "",
      heroImage: defaults?.heroImage ?? "",
      heroImageMobile: defaults?.heroImageMobile ?? "",
      metaTitle: defaults?.metaTitle ?? "",
      metaDesc: defaults?.metaDesc ?? "",
      ogImage: defaults?.ogImage ?? "",
      published: defaults?.published ?? false,
      sortOrder: defaults?.sortOrder ?? 0,
    },
  });

  const nameVal = watch("name");
  useEffect(() => {
    if (!isEdit && nameVal) setValue("slug", slugify(nameVal));
  }, [nameVal, isEdit, setValue]);

  async function uploadFile(file: File, field: ImageField) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "tour-collections");
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as { url: string };
      setValue(field, data.url);
      toast.success("Image uploaded.");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        const url = isEdit ? `/api/tour-collections/${defaults!.id}` : "/api/tour-collections";
        const res = await fetch(url, {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          if (res.status === 403) {
            toast.error(
              "You don't have permission to save collections. Contact your administrator.",
            );
            return;
          }
          const err = (await res.json()) as {
            error?: string | { fieldErrors?: Record<string, string[]> };
          };
          const fieldMsg =
            typeof err.error === "object"
              ? Object.values(err.error.fieldErrors ?? {})[0]?.[0]
              : null;
          toast.error(typeof err.error === "string" ? err.error : (fieldMsg ?? "Save failed"));
          return;
        }
        toast.success(isEdit ? "Collection updated!" : "Collection created!");
        router.push("/admin/packages/collections");
        router.refresh();
      } catch {
        toast.error("An error occurred.");
      }
    });
  }

  const slugVal = watch("slug");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <div className={cardCls}>
            <h3 className="font-bold text-foreground text-sm">Collection</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Name (H1) *</label>
                <input
                  {...register("name")}
                  className={inputCls}
                  placeholder="e.g. Kashmir Tour Packages"
                />
                {errors.name && (
                  <p className="text-[12px] text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className={labelCls}>Slug *</label>
                <input
                  {...register("slug")}
                  className={`${inputCls} font-mono`}
                  placeholder="e.g. kashmir-tour-packages"
                />
                <p className="text-[12px] text-muted-foreground mt-1">
                  Public URL: /{slugVal || "…"}
                </p>
                {errors.slug && (
                  <p className="text-[12px] text-red-500 mt-1">{errors.slug.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className={labelCls}>Intro</label>
              <p className="text-[12px] text-muted-foreground mb-1">
                Short hero subtitle — unique to this collection.
              </p>
              <textarea {...register("intro")} rows={3} className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className={labelCls}>Content (HTML)</label>
              <p className="text-[12px] text-muted-foreground mb-1">
                The genuinely useful body of the page — best time to visit, how to reach, what makes
                these tours different. Use &lt;h2&gt;/&lt;h3&gt;/&lt;p&gt;/&lt;ul&gt;. A collection
                without real content should stay unpublished.
              </p>
              <textarea
                {...register("content")}
                rows={14}
                className={`${inputCls} font-mono text-xs`}
              />
            </div>
          </div>

          <div className={cardCls}>
            <h3 className="font-bold text-foreground text-sm">Visibility</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <input
                  type="checkbox"
                  {...register("published")}
                  className="h-4 w-4 accent-primary"
                />
                Published
              </label>
              <div>
                <label className={labelCls}>Sort order</label>
                <input type="number" {...register("sortOrder")} className={inputCls} />
              </div>
            </div>
            <p className="text-[12px] text-muted-foreground">
              Lower sort order appears first in &quot;Browse Tour Packages&quot; on /tours, and
              decides a tour&apos;s breadcrumb when it belongs to several collections. A published
              collection with no published tours returns 404.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className={cardCls}>
            <h3 className="font-bold text-foreground text-sm">Hero</h3>
            <ImageInput
              label="Hero Image"
              field="heroImage"
              value={watch("heroImage")}
              registration={register("heroImage")}
              uploading={uploading}
              onPick={setPicker}
              onUpload={uploadFile}
            />
            <ImageInput
              label="Hero Image (Mobile)"
              hint="Leave blank to reuse the desktop image."
              field="heroImageMobile"
              value={watch("heroImageMobile")}
              registration={register("heroImageMobile")}
              uploading={uploading}
              onPick={setPicker}
              onUpload={uploadFile}
            />
          </div>

          <div className={cardCls}>
            <h3 className="font-bold text-foreground text-sm">SEO</h3>
            <div>
              <label className={labelCls}>Meta Title</label>
              <input {...register("metaTitle")} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Meta Description</label>
              <textarea {...register("metaDesc")} rows={3} className={`${inputCls} resize-none`} />
            </div>
            <ImageInput
              label="OG Image"
              hint="Leave blank to reuse the hero image."
              field="ogImage"
              value={watch("ogImage")}
              registration={register("ogImage")}
              uploading={uploading}
              onPick={setPicker}
              onUpload={uploadFile}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending || uploading}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Create Collection"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/packages/collections")}
          className="text-sm text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-xl border border-border transition-colors"
        >
          Cancel
        </button>
      </div>

      <GalleryPicker
        open={picker !== null}
        type="IMAGE"
        onSelect={(url) => picker && setValue(picker, url)}
        onClose={() => setPicker(null)}
      />
    </form>
  );
}
