"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { BannerStripView } from "@/components/public/BannerStrip";
import { PromoBannerCard } from "@/components/public/PromoBanner";
import { ImageField } from "@/components/admin/pages/ImageField";

type BannerType = "STRIP" | "PROMO";

export interface BannerFormData {
  id: string;
  type: BannerType;
  title: string;
  body: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
  imageMobileUrl: string | null;
  pages: string; // JSON string array
  isActive: boolean;
  sortOrder: number;
  startsAt: string | null; // ISO
  endsAt: string | null; // ISO
}

// Page targeting options — "*" means every public page.
const PAGE_OPTIONS: { key: string; label: string }[] = [
  { key: "*", label: "All Pages" },
  { key: "home", label: "Home" },
  { key: "tours", label: "Tours" },
  { key: "destinations", label: "Destinations" },
  { key: "blog", label: "Blog" },
  { key: "about", label: "About" },
  { key: "contact", label: "Contact" },
];

function parsePages(raw: string): string[] {
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : ["*"];
  } catch {
    return ["*"];
  }
}

// ISO → yyyy-mm-dd for <input type="date">.
function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";
const labelClass = "block text-xs font-semibold text-foreground";
const hintClass = "text-[12px] text-muted-foreground";

export function BannerForm({
  initial,
  canEdit,
}: {
  initial: BannerFormData | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [type, setType] = useState<BannerType>(initial?.type ?? "STRIP");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [ctaLabel, setCtaLabel] = useState(initial?.ctaLabel ?? "");
  const [ctaUrl, setCtaUrl] = useState(initial?.ctaUrl ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [imageMobileUrl, setImageMobileUrl] = useState(initial?.imageMobileUrl ?? "");
  const [pages, setPages] = useState<string[]>(initial ? parsePages(initial.pages) : ["*"]);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [startsAt, setStartsAt] = useState(toDateInput(initial?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toDateInput(initial?.endsAt ?? null));
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  function togglePage(key: string) {
    setPages((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  function submit() {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (pages.length === 0) {
      toast.error("Select at least one page.");
      return;
    }

    const payload = {
      type,
      title: title.trim(),
      body,
      ctaLabel,
      ctaUrl,
      imageUrl: type === "PROMO" ? imageUrl : "",
      imageMobileUrl: type === "PROMO" ? imageMobileUrl : "",
      pages,
      isActive,
      sortOrder: Number(sortOrder) || 0,
      startsAt,
      endsAt,
    };

    startTransition(async () => {
      try {
        const res = await fetch(initial ? `/api/banners/${initial.id}` : "/api/banners", {
          method: initial ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          toast.error(
            res.status === 403
              ? "You don't have permission to do that."
              : "Save failed. Please try again.",
          );
          return;
        }
        toast.success(initial ? "Banner updated." : "Banner created.");
        router.push("/admin/banners");
        router.refresh();
      } catch {
        toast.error("Network error. Please try again.");
      }
    });
  }

  // Live preview data — mirrors the public rendering, with graceful placeholders
  // so the preview is never empty while the admin is still typing.
  const previewStrip = {
    id: "preview",
    title: title.trim() || "Your announcement headline goes here",
    body: body.trim() || null,
    ctaLabel: ctaLabel.trim() || null,
    ctaUrl: ctaUrl.trim() || "#",
  };
  const previewPromo = {
    id: "preview",
    title: title.trim() || "Your promo headline",
    body: body.trim() || "Supporting copy that describes the offer in a sentence or two.",
    ctaLabel: ctaLabel.trim() || null,
    ctaUrl: ctaUrl.trim() || "#",
    imageUrl: type === "PROMO" ? imageUrl.trim() || null : null,
    imageMobileUrl: type === "PROMO" ? imageMobileUrl.trim() || null : null,
  };

  return (
    <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:gap-6">
      {/* ── Left: form ─────────────────────────────────────────────────────── */}
      <div className="min-w-0 space-y-5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:space-y-6 sm:p-6">
        {/* Type */}
        <div className="space-y-2">
          <label className={labelClass}>Type</label>
          <div className="grid grid-cols-2 gap-2">
            {(["STRIP", "PROMO"] as BannerType[]).map((t) => (
              <button
                key={t}
                type="button"
                disabled={!canEdit}
                aria-pressed={type === t}
                onClick={() => setType(t)}
                className={cn(
                  "rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition disabled:opacity-60",
                  type === t
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                <span className="block">{t === "STRIP" ? "Strip" : "Promo"}</span>
                <span className="mt-0.5 block text-[12px] font-normal opacity-80">
                  {t === "STRIP" ? "Thin bar above the navbar" : "Inline image + text card"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label htmlFor="bf-title" className={labelClass}>
            Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="bf-title"
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canEdit}
            aria-required="true"
            placeholder="Monsoon Sale — 20% Off all Kashmir tours"
          />
          <p className={hintClass}>
            Numbers like “20% Off” are automatically highlighted in gold on the strip.
          </p>
        </div>

        {/* Body */}
        <div className="space-y-1.5">
          <label htmlFor="bf-body" className={labelClass}>
            Body text
          </label>
          <textarea
            id="bf-body"
            className={cn(inputClass, "min-h-[84px] resize-y")}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={!canEdit}
            placeholder={
              type === "STRIP"
                ? "Short supporting line (hidden on mobile)"
                : "A sentence or two describing the offer"
            }
          />
        </div>

        {/* CTA */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="bf-cta-label" className={labelClass}>
              CTA Label
            </label>
            <input
              id="bf-cta-label"
              className={inputClass}
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              disabled={!canEdit}
              placeholder="Book now"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="bf-cta-url" className={labelClass}>
              CTA URL
            </label>
            <input
              id="bf-cta-url"
              className={inputClass}
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              disabled={!canEdit}
              placeholder="/tours"
            />
          </div>
        </div>

        {/* Images — PROMO only. Paste a URL, pick from the gallery, or upload.
            Desktop is the background; mobile is used on ≤640px screens. */}
        {type === "PROMO" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={labelClass}>
                Desktop image <span className="text-rose-500">*</span>
              </label>
              {canEdit ? (
                <ImageField value={imageUrl} onChange={setImageUrl} folder="banners" />
              ) : (
                <input className={inputClass} value={imageUrl} readOnly disabled />
              )}
              <p className={hintClass}>Full-bleed background. Wide landscape (≈21:9) works best.</p>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Mobile image</label>
              {canEdit ? (
                <ImageField value={imageMobileUrl} onChange={setImageMobileUrl} folder="banners" />
              ) : (
                <input className={inputClass} value={imageMobileUrl} readOnly disabled />
              )}
              <p className={hintClass}>
                Optional. Portrait-friendly crop for phones; falls back to desktop.
              </p>
            </div>
          </div>
        )}

        {/* Pages */}
        <div className="space-y-2">
          <label className={labelClass}>Show on pages</label>
          <div className="flex flex-wrap gap-2">
            {PAGE_OPTIONS.map((opt) => (
              <label
                key={opt.key}
                className={cn(
                  "flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition focus-within:ring-2 focus-within:ring-primary/30",
                  pages.includes(opt.key)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                  !canEdit && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={pages.includes(opt.key)}
                  onChange={() => togglePage(opt.key)}
                  disabled={!canEdit}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Sort order + Active */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="bf-sort" className={labelClass}>
              Sort order
            </label>
            <input
              id="bf-sort"
              type="number"
              className={inputClass}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              disabled={!canEdit}
            />
            <p className={hintClass}>Lower shows first. The lowest active strip wins.</p>
          </div>
          <div className="flex items-start pt-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={!canEdit}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Active
            </label>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="bf-start" className={labelClass}>
              Start date
            </label>
            <input
              id="bf-start"
              type="date"
              className={inputClass}
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="bf-end" className={labelClass}>
              End date
            </label>
            <input
              id="bf-end"
              type="date"
              className={inputClass}
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>

        {canEdit && (
          // Normal-flow action bar: full-width buttons stacked with gap-3 on
          // phones (never overlap), a right-aligned inline row from `sm` up.
          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/admin/banners")}
              disabled={isPending}
              className="min-h-[44px] w-full min-w-0 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted disabled:opacity-60 sm:min-h-0 sm:w-auto sm:py-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={isPending}
              className="inline-flex min-h-[44px] w-full min-w-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:brightness-110 disabled:opacity-60 sm:min-h-0 sm:w-auto sm:py-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isPending ? "Saving…" : initial ? "Save changes" : "Create banner"}
            </button>
          </div>
        )}
      </div>

      {/* ── Right: sticky live preview (below the form on mobile/tablet) ────── */}
      <aside
        className="min-w-0 lg:sticky lg:top-2 lg:max-h-[calc(100vh-5rem)] lg:self-start lg:overflow-y-auto"
        aria-label="Live preview"
      >
        <div className="space-y-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Live preview
            </p>
            {/* Desktop / mobile preview toggle. */}
            <div
              role="tablist"
              aria-label="Preview device"
              className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5"
            >
              {(["desktop", "mobile"] as const).map((d) => {
                const Icon = d === "desktop" ? Monitor : Smartphone;
                const active = device === d;
                return (
                  <button
                    key={d}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-label={`${d} preview`}
                    onClick={() => setDevice(d)}
                    className={cn(
                      "grid h-8 w-10 place-items-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frame — narrows to a phone width in mobile mode, centred, animated. */}
          <div
            className={cn(
              "mx-auto transition-[max-width] duration-300",
              device === "mobile" ? "max-w-[360px]" : "max-w-full",
            )}
          >
            {type === "STRIP" ? (
              <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                <BannerStripView banner={previewStrip} forceMobile={device === "mobile"} />
                {/* Faux navbar so the strip's placement above it reads clearly. */}
                <div className="flex items-center justify-between bg-card px-3 py-2">
                  <div className="h-2.5 w-16 rounded-full bg-muted-foreground/30" />
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-7 rounded-full bg-muted-foreground/20" />
                    <div className="h-2 w-7 rounded-full bg-muted-foreground/20" />
                    <div className="h-4 w-12 rounded-full bg-primary/70" />
                  </div>
                </div>
                <div className="h-12 bg-gradient-to-b from-muted/50 to-transparent" />
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-gradient-to-br from-muted/40 to-background p-3">
                <PromoBannerCard banner={previewPromo} preview stacked={device === "mobile"} />
              </div>
            )}
          </div>

          <p className={hintClass}>Updates live as you edit. Mirrors the public site.</p>
        </div>
      </aside>
    </div>
  );
}
