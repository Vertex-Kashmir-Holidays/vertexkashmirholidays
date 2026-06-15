"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Upload } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug: lowercase, numbers, hyphens only"),
  location: z.string().optional(),
  excerpt: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  ogImage: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaults?: Partial<FormData> & { id?: string };
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function DestinationForm({ defaults }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const isEdit = !!defaults?.id;

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
      location: defaults?.location ?? "",
      excerpt: defaults?.excerpt ?? "",
      description: defaults?.description ?? "",
      coverImage: defaults?.coverImage ?? "",
      metaTitle: defaults?.metaTitle ?? "",
      metaDesc: defaults?.metaDesc ?? "",
      ogImage: defaults?.ogImage ?? "",
    },
  });

  const nameVal = watch("name");
  useEffect(() => {
    if (!isEdit && nameVal) setValue("slug", slugify(nameVal));
  }, [nameVal, isEdit, setValue]);

  const coverImage = watch("coverImage");

  async function uploadFile(file: File, field: "coverImage" | "ogImage") {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json() as { url: string };
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
        const url = isEdit ? `/api/destinations/${defaults!.id}` : "/api/destinations";
        const method = isEdit ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json() as { error?: string | { fieldErrors?: Record<string, string[]> } };
          const msg = typeof err.error === "string" ? err.error : "Save failed";
          toast.error(msg);
          return;
        }
        toast.success(isEdit ? "Destination updated!" : "Destination created!");
        router.push("/admin/destinations");
        router.refresh();
      } catch {
        toast.error("An error occurred.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      {/* Basic Info */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-foreground text-sm">Basic Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Name *</label>
            <input {...register("name")} className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" placeholder="e.g. Dal Lake" />
            {errors.name && <p className="text-[10px] text-red-500 dark:text-red-400 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Slug *</label>
            <input {...register("slug")} className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition font-mono" placeholder="e.g. dal-lake" />
            {errors.slug && <p className="text-[10px] text-red-500 dark:text-red-400 mt-1">{errors.slug.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Location</label>
          <input {...register("location")} className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" placeholder="e.g. Srinagar, Kashmir" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Excerpt</label>
          <textarea {...register("excerpt")} rows={2} className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition resize-none" placeholder="Short description for listing cards..." />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Description</label>
          <textarea {...register("description")} rows={5} className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition resize-none" placeholder="Full destination description..." />
        </div>
      </div>

      {/* Cover Image */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-foreground text-sm">Cover Image</h3>
        <div className="flex gap-3">
          <input
            {...register("coverImage")}
            className="flex-1 px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
            placeholder="https://... or /uploads/..."
          />
          <label className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-border cursor-pointer transition-colors ${uploading ? "opacity-50" : "hover:border-primary hover:text-primary"}`}>
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Upload
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "coverImage")} />
          </label>
        </div>
        {coverImage && (
          <div className="relative h-40 rounded-xl overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* SEO */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-foreground text-sm">SEO</h3>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Meta Title</label>
          <input {...register("metaTitle")} className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Meta Description</label>
          <textarea {...register("metaDesc")} rows={2} className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">OG Image URL</label>
          <input {...register("ogImage")} className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || uploading}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Create Destination"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/destinations")}
          className="text-sm text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-xl border border-border transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
