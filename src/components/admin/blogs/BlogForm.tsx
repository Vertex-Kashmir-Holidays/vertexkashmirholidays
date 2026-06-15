"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Upload, Eye } from "lucide-react";

const schema = z.object({
  title: z.string().min(3, "Title is required"),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug: lowercase, numbers, hyphens only"),
  author: z.string().optional(),
  excerpt: z.string().optional(),
  body: z.string().optional(),
  coverImage: z.string().optional(),
  published: z.boolean().optional(),
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

export function BlogForm({ defaults }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [previewBody, setPreviewBody] = useState(false);
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
      title: defaults?.title ?? "",
      slug: defaults?.slug ?? "",
      author: defaults?.author ?? "",
      excerpt: defaults?.excerpt ?? "",
      body: defaults?.body ?? "",
      coverImage: defaults?.coverImage ?? "",
      published: defaults?.published ?? false,
      metaTitle: defaults?.metaTitle ?? "",
      metaDesc: defaults?.metaDesc ?? "",
      ogImage: defaults?.ogImage ?? "",
    },
  });

  const titleVal = watch("title");
  useEffect(() => {
    if (!isEdit && titleVal) setValue("slug", slugify(titleVal));
  }, [titleVal, isEdit, setValue]);

  const coverImage = watch("coverImage");
  const bodyVal = watch("body");
  const publishedVal = watch("published");

  async function uploadFile(file: File, field: "coverImage" | "ogImage") {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json() as { url: string };
      setValue(field, data.url);
      toast.success("Image uploaded.");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleSave(publish: boolean) {
    setValue("published", publish);
    handleSubmit(onSubmit)();
  }

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        const url = isEdit ? `/api/blogs/${defaults!.id}` : "/api/blogs";
        const method = isEdit ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json() as { error?: string | Record<string, unknown> };
          const msg = typeof err.error === "string" ? err.error : "Save failed";
          toast.error(msg);
          return;
        }
        toast.success(isEdit ? "Blog post updated!" : "Blog post created!");
        router.push("/admin/blogs");
        router.refresh();
      } catch {
        toast.error("An error occurred.");
      }
    });
  }

  return (
    <div className="flex gap-6 items-start">
      {/* Main form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 min-w-0 space-y-5">
        {/* Basic Info */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-foreground text-sm">Post Details</h3>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Title *</label>
            <input {...register("title")} className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" placeholder="e.g. Why 7 Days in Kashmir is Perfect" />
            {errors.title && <p className="text-[10px] text-red-500 dark:text-red-400 mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Slug *</label>
              <input {...register("slug")} className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition font-mono" />
              {errors.slug && <p className="text-[10px] text-red-500 dark:text-red-400 mt-1">{errors.slug.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Author</label>
              <input {...register("author")} className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" placeholder="e.g. Wani Owais" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Excerpt</label>
            <textarea {...register("excerpt")} rows={2} className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition resize-none" placeholder="Short description for cards and meta..." />
          </div>
        </div>

        {/* Cover Image */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-foreground text-sm">Cover Image</h3>
          <div className="flex gap-3">
            <input {...register("coverImage")} className="flex-1 px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" placeholder="https://... or /uploads/..." />
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

        {/* Body */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm">Body Content (HTML)</h3>
            <button
              type="button"
              onClick={() => setPreviewBody((p) => !p)}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              {previewBody ? "Edit" : "Preview"}
            </button>
          </div>

          {previewBody ? (
            <div
              className="prose prose-sm max-w-none min-h-[300px] p-4 border border-border rounded-xl bg-muted/50 text-sm text-foreground"
              dangerouslySetInnerHTML={{ __html: bodyVal ?? "" }}
            />
          ) : (
            <textarea
              {...register("body")}
              rows={18}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition resize-y font-mono"
              placeholder="<p>Your blog content here. HTML is supported.</p>"
            />
          )}
          <p className="text-[10px] text-muted-foreground">HTML is rendered as-is on the public blog page.</p>
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
            <div className="flex gap-3">
              <input {...register("ogImage")} className="flex-1 px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" />
              <label className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-border cursor-pointer transition-colors ${uploading ? "opacity-50" : "hover:border-primary hover:text-primary"}`}>
                <Upload className="w-3.5 h-3.5" />
                Upload
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "ogImage")} />
              </label>
            </div>
          </div>
        </div>
      </form>

      {/* Right sidebar */}
      <div className="w-64 shrink-0 space-y-4 sticky top-4">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-foreground text-sm">Publish</h3>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Status</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${publishedVal ? "bg-green-500/15 text-green-700 dark:text-green-300" : "bg-muted text-muted-foreground"}`}>
              {publishedVal ? "Published" : "Draft"}
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isPending || uploading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {publishedVal ? "Update Post" : "Publish"}
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isPending || uploading}
              className="w-full text-sm font-semibold text-muted-foreground hover:text-foreground px-4 py-2 rounded-xl border border-border hover:border-border transition-colors disabled:opacity-60"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/blogs")}
              className="w-full text-xs text-muted-foreground hover:text-muted-foreground py-1 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
