"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Eye, ExternalLink, ChevronDown, ImageIcon, X } from "lucide-react";
import Link from "next/link";
import { BlogPostBody } from "@/components/blog/BlogPostBody";
import { GalleryPicker } from "@/components/admin/pages/GalleryPicker";
import { cn } from "@/lib/utils";

interface LegalPageItem {
  slug: string;
  navLabel: string;
  title: string;
  content: string;
  /** Admin-set desktop banner (null = using the shipped default). */
  heroImage: string | null;
  /** Admin-set ≤640px banner. */
  heroImageMobile: string | null;
  /** Shipped default banner, shown as a preview when no custom image is set. */
  defaultHeroImage: string;
  updatedAt: string | null;
}

interface Props {
  pages: LegalPageItem[];
  canEdit: boolean;
}

const inputCls =
  "w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:bg-muted disabled:text-muted-foreground";

function PageCard({
  page,
  canEdit,
  defaultOpen,
}: {
  page: LegalPageItem;
  canEdit: boolean;
  defaultOpen: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [heroImage, setHeroImage] = useState(page.heroImage);
  const [heroImageMobile, setHeroImageMobile] = useState(page.heroImageMobile);
  // Which banner slot the gallery picker is currently choosing for.
  const [picking, setPicking] = useState<null | "desktop" | "mobile">(null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/legal/${page.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content,
          heroImage: heroImage ?? "",
          heroImageMobile: heroImageMobile ?? "",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : "Save failed");
      }
      toast.success(`${page.navLabel} saved.`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-foreground">{page.navLabel}</h3>
          <p className="truncate text-xs text-muted-foreground">/{page.slug}</p>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border p-5">
          {/* Banner / hero image — replaceable, picked from the media gallery. */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              Hero Banner
            </label>
            <div className="flex flex-wrap items-start gap-4">
              <BannerSlot
                heading="Desktop"
                url={heroImage}
                fallback={page.defaultHeroImage}
                canEdit={canEdit}
                onPick={() => setPicking("desktop")}
                onClear={() => setHeroImage(null)}
              />
              <BannerSlot
                heading="Mobile (optional)"
                url={heroImageMobile}
                fallback={null}
                canEdit={canEdit}
                onPick={() => setPicking("mobile")}
                onClear={() => setHeroImageMobile(null)}
              />
            </div>
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              Shown as the page banner. Leave empty to use the built-in default image.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              Page Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEdit}
              className={inputCls}
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-semibold text-muted-foreground">
                Content (HTML)
              </label>
              <button
                type="button"
                onClick={() => setPreview((p) => !p)}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
              >
                <Eye className="h-3.5 w-3.5" />
                {preview ? "Edit" : "Preview"}
              </button>
            </div>
            {preview ? (
              <div className="min-h-[320px] rounded-xl border border-border bg-muted/40 p-5">
                <BlogPostBody html={content} />
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={!canEdit}
                rows={22}
                className={cn(inputCls, "resize-y font-mono text-[14px] leading-relaxed")}
              />
            )}
            <p className="mt-1 text-[12px] text-muted-foreground">
              Use headings (&lt;h2&gt;), paragraphs (&lt;p&gt;), lists (&lt;ul&gt;/&lt;li&gt;) and
              links. Rendered with the site theme.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={`/${page.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              View live <ExternalLink className="h-3 w-3" />
            </Link>
            {canEdit && (
              <button
                onClick={save}
                disabled={busy}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </button>
            )}
          </div>
        </div>
      )}

      <GalleryPicker
        open={picking !== null}
        type="IMAGE"
        title={picking === "mobile" ? "Choose a mobile banner" : "Choose a banner image"}
        onSelect={(url) => (picking === "mobile" ? setHeroImageMobile(url) : setHeroImage(url))}
        onClose={() => setPicking(null)}
      />
    </div>
  );
}

// A single banner preview tile with "choose from gallery" and "clear" actions.
// Falls back to the shipped default preview when no custom image is set.
function BannerSlot({
  heading,
  url,
  fallback,
  canEdit,
  onPick,
  onClear,
}: {
  heading: string;
  url: string | null;
  fallback: string | null;
  canEdit: boolean;
  onPick: () => void;
  onClear: () => void;
}) {
  const shown = url ?? fallback;
  return (
    <div className="w-full max-w-[220px]">
      <p className="mb-1 text-[12px] font-semibold text-muted-foreground">{heading}</p>
      <div className="group relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-muted">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
        {!url && shown && (
          <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
            DEFAULT
          </span>
        )}
        {canEdit && url && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/80"
            aria-label="Clear image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {canEdit && (
        <button
          type="button"
          onClick={onPick}
          className="mt-1.5 w-full rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
        >
          Choose from gallery
        </button>
      )}
    </div>
  );
}

export function LegalPagesClient({ pages, canEdit }: Props) {
  return (
    <div className="space-y-4">
      {pages.map((page, i) => (
        <PageCard key={page.slug} page={page} canEdit={canEdit} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
