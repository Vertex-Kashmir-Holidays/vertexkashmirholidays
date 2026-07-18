"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Upload, Eye, Images, Plus, Trash2 } from "lucide-react";
import { GalleryPicker } from "@/components/admin/pages/GalleryPicker";
import sanitizeHtml from "sanitize-html";

const relatedTourItemSchema = z.object({
  tourId: z.string().optional(),
  ctaSentence: z.string().optional(),
});

const schema = z.object({
  title: z.string().min(3, "Title is required"),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase, numbers, hyphens only"),
  author: z.string().optional(),
  authorRole: z.string().optional(),
  authorBio: z.string().optional(),
  authorImage: z.string().optional(),
  category: z.string().optional(),
  readTime: z.string().regex(/^\d*$/, "Numbers only").optional(),
  featured: z.boolean().optional(),
  trending: z.boolean().optional(),
  relatedTours: z.array(relatedTourItemSchema).max(3, "Up to 3 related tours").optional(),
  excerpt: z.string().optional(),
  quickAnswer: z.string().optional(),
  body: z.string().optional(),
  coverImage: z.string().optional(),
  coverImageMobile: z.string().optional(),
  published: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  ogImage: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaults?: Partial<FormData> & { id?: string };
  categoryOptions?: { name: string; slug: string }[];
  tourOptions?: { id: string; title: string }[];
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function BlogForm({ defaults, categoryOptions = [], tourOptions = [] }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [previewBody, setPreviewBody] = useState(false);
  // Which field the gallery picker is currently feeding ("body" inserts an
  // <img> tag into the HTML content).
  const [picker, setPicker] = useState<
    null | "coverImage" | "coverImageMobile" | "ogImage" | "authorImage" | "body"
  >(null);
  const isEdit = !!defaults?.id;

  const {
    register,
    control,
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
      authorRole: defaults?.authorRole ?? "",
      authorBio: defaults?.authorBio ?? "",
      authorImage: defaults?.authorImage ?? "",
      category: defaults?.category ?? "",
      readTime: defaults?.readTime ?? "",
      featured: defaults?.featured ?? false,
      trending: defaults?.trending ?? false,
      relatedTours: (defaults?.relatedTours ?? []).map((r) => ({
        tourId: r.tourId,
        ctaSentence: r.ctaSentence,
      })),
      excerpt: defaults?.excerpt ?? "",
      quickAnswer: defaults?.quickAnswer ?? "",
      body: defaults?.body ?? "",
      coverImage: defaults?.coverImage ?? "",
      coverImageMobile: defaults?.coverImageMobile ?? "",
      published: defaults?.published ?? false,
      metaTitle: defaults?.metaTitle ?? "",
      metaDesc: defaults?.metaDesc ?? "",
      ogImage: defaults?.ogImage ?? "",
      ogTitle: defaults?.ogTitle ?? "",
      ogDescription: defaults?.ogDescription ?? "",
    },
  });

  const {
    fields: relatedFields,
    append: addRelated,
    remove: removeRelated,
  } = useFieldArray({ control, name: "relatedTours" });

  const titleVal = watch("title");
  useEffect(() => {
    if (!isEdit && titleVal) setValue("slug", slugify(titleVal));
  }, [titleVal, isEdit, setValue]);

  const coverImage = watch("coverImage");
  const coverImageMobile = watch("coverImageMobile");
  const authorImage = watch("authorImage");
  const bodyVal = watch("body");
  const publishedVal = watch("published");

  async function uploadFile(
    file: File,
    field: "coverImage" | "coverImageMobile" | "ogImage" | "authorImage",
  ) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "blog");
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { url: string };
      setValue(field, data.url);
      toast.success("Image uploaded.");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handlePickerSelect(url: string) {
    if (picker === "body") {
      const current = watch("body") ?? "";
      setValue("body", `${current}${current ? "\n" : ""}<img src="${url}" alt="" />`);
    } else if (picker) {
      setValue(picker, url);
    }
  }

  function handleSave(publish: boolean) {
    setValue("published", publish);
    handleSubmit(onSubmit)();
  }

  function onSubmit(data: FormData) {
    const { readTime, relatedTours, ...rest } = data;
    const payload = {
      ...rest,
      readTime: readTime ? Number(readTime) : undefined,
      relatedTours: JSON.stringify(
        (relatedTours ?? []).filter((r) => r.tourId && r.ctaSentence?.trim()),
      ),
    };
    startTransition(async () => {
      try {
        const url = isEdit ? `/api/blogs/${defaults!.id}` : "/api/blogs";
        const method = isEdit ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          if (res.status === 403) {
            toast.error(
              "You don't have permission to save blog posts. Contact your administrator.",
            );
            return;
          }
          const err = (await res.json()) as { error?: string | Record<string, unknown> };
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
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Main form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 min-w-0 w-full space-y-5">
        {/* Basic Info */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-foreground text-sm">Post Details</h3>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Title *
            </label>
            <input
              {...register("title")}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
              placeholder="e.g. Why 7 Days in Kashmir is Perfect"
            />
            {errors.title && (
              <p className="text-[12px] text-red-500 dark:text-red-400 mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Slug *
              </label>
              <input
                {...register("slug")}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition font-mono"
              />
              {errors.slug && (
                <p className="text-[12px] text-red-500 dark:text-red-400 mt-1">
                  {errors.slug.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Author
              </label>
              <input
                {...register("author")}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                placeholder="e.g. Wani Owais"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-muted-foreground">
                  Category
                </label>
                <Link
                  href="/admin/blog-categories"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  + Add New
                </Link>
              </div>
              <select
                {...register("category")}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
              >
                <option value="">— No category —</option>
                {categoryOptions.map((c) => (
                  <option key={c.slug} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Read Time (minutes)
              </label>
              <input
                {...register("readTime")}
                inputMode="numeric"
                className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition font-mono"
                placeholder="e.g. 8"
              />
              {errors.readTime && (
                <p className="text-[12px] text-red-500 dark:text-red-400 mt-1">
                  {errors.readTime.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Excerpt
            </label>
            <textarea
              {...register("excerpt")}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition resize-none"
              placeholder="Short description for cards and meta..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Quick Answer
            </label>
            <p className="text-[12px] text-muted-foreground mb-1">
              Short direct-answer callout shown near the top of the article, right before the body.
              HTML is accepted. Leave the "## Quick Answer" heading out of the Body field below if
              you fill this in.
            </p>
            <textarea
              {...register("quickAnswer")}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition resize-none"
              placeholder="e.g. The best time to visit Kashmir is..."
            />
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
            <button
              type="button"
              onClick={() => setPicker("coverImage")}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-border cursor-pointer transition-colors hover:border-primary hover:text-primary"
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
                onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "coverImage")}
              />
            </label>
          </div>
          {coverImage && (
            <div className="relative h-40 rounded-xl overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Cover Image (Mobile) */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <div>
            <h3 className="font-bold text-foreground text-sm">Cover Image (Mobile)</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Shown on phones instead of the desktop Cover Image. Leave blank to reuse the desktop
              image.
            </p>
          </div>
          <div className="flex gap-3">
            <input
              {...register("coverImageMobile")}
              className="flex-1 px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
              placeholder="https://... or /uploads/..."
            />
            <button
              type="button"
              onClick={() => setPicker("coverImageMobile")}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-border cursor-pointer transition-colors hover:border-primary hover:text-primary"
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
                onChange={(e) =>
                  e.target.files?.[0] && uploadFile(e.target.files[0], "coverImageMobile")
                }
              />
            </label>
          </div>
          {coverImageMobile && (
            <div className="relative h-40 w-40 mx-auto rounded-xl overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImageMobile}
                alt="Mobile cover preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Author */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <div>
            <h3 className="font-bold text-foreground text-sm">Author</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Shown on the public "About the Author" card and the article byline.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Author Role
              </label>
              <input
                {...register("authorRole")}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                placeholder="e.g. Local Travel Expert"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Author Bio
            </label>
            <textarea
              {...register("authorBio")}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition resize-none"
              placeholder="Short bio shown on the author card..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Author Image
            </label>
            <div className="flex gap-3">
              <input
                {...register("authorImage")}
                className="flex-1 px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                placeholder="https://... or /uploads/..."
              />
              <button
                type="button"
                onClick={() => setPicker("authorImage")}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-border cursor-pointer transition-colors hover:border-primary hover:text-primary"
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
                  onChange={(e) =>
                    e.target.files?.[0] && uploadFile(e.target.files[0], "authorImage")
                  }
                />
              </label>
            </div>
            {authorImage && (
              <div className="relative mt-3 h-20 w-20 rounded-full overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={authorImage}
                  alt="Author preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm">Body Content (HTML)</h3>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPicker("body")}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <Images className="w-3.5 h-3.5" />
                Insert image
              </button>
              <button
                type="button"
                onClick={() => setPreviewBody((p) => !p)}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                {previewBody ? "Edit" : "Preview"}
              </button>
            </div>
          </div>

          {previewBody ? (
            <div
              className="prose prose-sm max-w-none min-h-[300px] p-4 border border-border rounded-xl bg-muted/50 text-sm text-foreground"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(bodyVal ?? "", {
                  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
                    "img",
                    "h1",
                    "h2",
                    "h3",
                    "h4",
                    "h5",
                    "h6",
                    "pre",
                    "code",
                    "figure",
                    "figcaption",
                  ]),
                  allowedAttributes: {
                    ...sanitizeHtml.defaults.allowedAttributes,
                    "*": ["class"],
                    img: ["src", "alt", "title", "width", "height", "loading"],
                  },
                  allowedSchemes: ["http", "https", "mailto", "tel"],
                }),
              }}
            />
          ) : (
            <textarea
              {...register("body")}
              rows={18}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition resize-y font-mono"
              placeholder="<p>Your blog content here. HTML is supported.</p>"
            />
          )}
          <p className="text-[12px] text-muted-foreground">
            HTML is rendered as-is on the public blog page.
          </p>
        </div>

        {/* Related Tours */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm">Related Tours</h3>
            {relatedFields.length < 3 && (
              <button
                type="button"
                onClick={() => addRelated({ tourId: "", ctaSentence: "" })}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Related Tour
              </button>
            )}
          </div>
          <p className="text-[12px] text-muted-foreground -mt-2">
            Up to 3 curated pairings shown at the end of the article. Each links to a tour with a
            custom &ldquo;why it fits&rdquo; sentence — not an automatic feed.
          </p>
          {relatedFields.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No related tours added yet.</p>
          ) : (
            <div className="space-y-2">
              {relatedFields.map((field, i) => (
                <div
                  key={field.id}
                  className="border border-border rounded-xl p-3 bg-muted/50 grid grid-cols-1 sm:grid-cols-[1fr_2fr_32px] gap-2 items-start"
                >
                  <select
                    {...register(`relatedTours.${i}.tourId`)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                  >
                    <option value="">Select a tour…</option>
                    {tourOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                  <input
                    {...register(`relatedTours.${i}.ctaSentence`)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                    placeholder='Why it fits — e.g. "Planning a comfortable family vacation?"'
                  />
                  <button
                    type="button"
                    onClick={() => removeRelated(i)}
                    className="text-muted-foreground/60 hover:text-red-400 transition-colors justify-self-start sm:mt-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SEO */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-foreground text-sm">SEO</h3>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Meta Title
            </label>
            <input
              {...register("metaTitle")}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Meta Description
            </label>
            <textarea
              {...register("metaDesc")}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              OG Image URL
            </label>
            <div className="flex gap-3">
              <input
                {...register("ogImage")}
                className="flex-1 px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
              />
              <button
                type="button"
                onClick={() => setPicker("ogImage")}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-border cursor-pointer transition-colors hover:border-primary hover:text-primary"
              >
                <Images className="w-3.5 h-3.5" />
                Gallery
              </button>
              <label
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-border cursor-pointer transition-colors ${uploading ? "opacity-50" : "hover:border-primary hover:text-primary"}`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "ogImage")}
                />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              OG Title
            </label>
            <p className="text-[12px] text-muted-foreground mb-1">
              Overrides Meta Title for social shares. Leave blank to reuse Meta Title.
            </p>
            <input
              {...register("ogTitle")}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              OG Description
            </label>
            <p className="text-[12px] text-muted-foreground mb-1">
              Overrides Meta Description for social shares. Leave blank to reuse Meta Description.
            </p>
            <textarea
              {...register("ogDescription")}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition resize-none"
            />
          </div>
        </div>
      </form>

      {/* Right sidebar */}
      <div className="w-full lg:w-64 shrink-0 space-y-4 lg:sticky lg:top-4">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-foreground text-sm">Publish</h3>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Status</span>
            <span
              className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${publishedVal ? "bg-green-500/15 text-green-700 dark:text-green-300" : "bg-muted text-muted-foreground"}`}
            >
              {publishedVal ? "Published" : "Draft"}
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <label className="flex items-center justify-between text-xs font-semibold text-foreground cursor-pointer">
              Featured
              <input type="checkbox" {...register("featured")} className="h-4 w-4 accent-primary" />
            </label>
            <label className="flex items-center justify-between text-xs font-semibold text-foreground cursor-pointer">
              Trending
              <input type="checkbox" {...register("trending")} className="h-4 w-4 accent-primary" />
            </label>
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

      <GalleryPicker
        open={picker !== null}
        type="IMAGE"
        title={picker === "body" ? "Insert image into body" : "Choose an image from gallery"}
        onSelect={handlePickerSelect}
        onClose={() => setPicker(null)}
      />
    </div>
  );
}
