"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Monitor, Plus, Smartphone, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BannerStripView } from "@/components/public/BannerStrip";
import { PromoBannerCard } from "@/components/public/PromoBanner";
import { ImageField } from "@/components/admin/pages/ImageField";
import { isWhatsAppCtaUrl, getWhatsAppCtaMessage, buildWhatsAppCtaUrl } from "@/lib/whatsappCtaUrl";
import {
  BANNER_ICONS,
  MAX_BANNER_FEATURES,
  parseBannerFeatures,
  type BannerFeature,
} from "@/components/public/bannerIcons";

type BannerType = "STRIP" | "PROMO";
type BannerLayout = "OVERLAY" | "SPLIT";

export interface BannerFormData {
  id: string;
  type: BannerType;
  title: string;
  body: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
  imageMobileUrl: string | null;
  layout: BannerLayout;
  contentBackground: boolean;
  kicker: string | null;
  subtitle: string | null;
  features: string; // JSON BannerFeature[]
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
  {
    key: "trip-planner-before-tours",
    label: "Plan Your Trip — full banner before “Kashmir Tour Packages”",
  },
  {
    key: "trip-planner-after-pricing",
    label: "Plan Your Trip — full banner after “How Pricing Works”",
  },
  {
    key: "trip-planner-after-why",
    label: "Plan Your Trip — full banner after “Why Plan With Vertex”",
  },
  {
    key: "tour-collection-after-6",
    label: "Tour Packages pages — banner after the first 6 tour cards",
  },
  {
    key: "tour-collection-after-all",
    label: "Tour Packages pages — banner after all tour cards",
  },
  {
    key: "offer-after-plans",
    label: "Offer pages — banner after “Plans & Prices”",
  },
  {
    key: "offer-after-itinerary",
    label: "Offer pages — banner after the day-by-day itinerary",
  },
];

// Example content for the three Plan Your Trip promo slots — each slot has its
// own travel mode (train before the packages, flights after "How Pricing
// Works", bus after "Why Plan With Vertex"). When one of these slots is ticked
// under "Show on pages", empty fields preview as its example (never saved) and
// "Fill with example" loads it into the empty fields. Each example covers both
// promo layouts (overlay uses title/body/CTA; split adds kicker/subtitle/features).
interface BannerExample {
  label: string;
  kicker: string;
  title: string;
  subtitle: string;
  body: string;
  features: BannerFeature[];
  ctaLabel: string;
  ctaMessage: string;
  imageUrl: string;
  imageMobileUrl: string;
}
const TRIP_PLANNER_EXAMPLES: Record<string, BannerExample> = {
  // Offer pages (/offers/…) — transport around the fixed-date trip.
  "offer-after-plans": {
    label: "getting to Kashmir",
    kicker: "Getting to Kashmir",
    title: "Flights & trains to your offer dates",
    subtitle: "Arranged with your package",
    body: "Tell us your city — we compare flights to Srinagar and trains to Jammu/Katra for your travel dates and time your airport pickup to your arrival.",
    features: [
      { icon: "plane", title: "Flights", text: "Direct & connecting to Srinagar" },
      { icon: "train", title: "Trains", text: "To Jammu, Katra & Srinagar" },
      { icon: "car", title: "Pickup", text: "Timed to your arrival" },
    ],
    ctaLabel: "Get Travel Options",
    ctaMessage: "Hi! I'd like flight/train options to Kashmir for my offer dates.",
    imageUrl: "/hero/srinagar-lg.webp",
    imageMobileUrl: "/hero/srinagar.webp",
  },
  "offer-after-itinerary": {
    label: "local union cabs",
    kicker: "Local transport",
    title: "Pahalgam & Sonamarg sightseeing by union cab",
    subtitle: "Booked for you, before you arrive",
    body: "Aru, Betaab Valley and Chandanwari in Pahalgam, and Thajiwas Glacier / Zero Point in Sonamarg, are reached by local union taxis. Add them to your plan and we'll arrange them.",
    features: [
      { icon: "car", title: "ABC Union", text: "Aru, Betaab & Chandanwari" },
      { icon: "mountain", title: "Sonamarg Union", text: "Thajiwas & Zero Point" },
      { icon: "calendar", title: "Pre-booked", text: "No waiting on the day" },
    ],
    ctaLabel: "Add Union Cabs",
    ctaMessage: "Hi! I'd like to add Pahalgam/Sonamarg union cabs to my offer package.",
    imageUrl: "/hero/pahalgam-lg.webp",
    imageMobileUrl: "/hero/pahalgam.webp",
  },
  "trip-planner-before-tours": {
    label: "train travel",
    kicker: "Reach Kashmir by rail",
    title: "Travelling by train?",
    subtitle: "We'll sort out your tickets",
    body: "Vande Bharat and express trains to Katra and Srinagar — we help you pick the right train and confirm your seats along with your tour.",
    features: [
      { icon: "train", title: "Right train", text: "Best connections to Katra & Srinagar" },
      { icon: "ticket", title: "Seat booking", text: "Confirmed reservations" },
      { icon: "car", title: "Station pickup", text: "Cab waiting on arrival" },
    ],
    ctaLabel: "Get Train Assistance",
    ctaMessage: "Hi! I'd like help booking train tickets to Kashmir.",
    imageUrl: "/hero/pahalgam-lg.webp",
    imageMobileUrl: "/hero/pahalgam.webp",
  },
  "trip-planner-after-pricing": {
    label: "flights",
    kicker: "Fly into Srinagar",
    title: "Need help getting to Kashmir?",
    subtitle: "Flights arranged with your tour",
    body: "Direct and connecting flights to Srinagar from major cities — we compare routes and fares and time your airport pickup to your landing.",
    features: [
      { icon: "plane", title: "Best fares", text: "Compared across airlines" },
      { icon: "calendar", title: "Right timing", text: "Matched to your itinerary" },
      { icon: "car", title: "Airport pickup", text: "Waiting when you land" },
    ],
    ctaLabel: "Get Flight Assistance",
    ctaMessage: "Hi! I'd like help booking flights to Srinagar for my Kashmir trip.",
    imageUrl: "/hero/srinagar-lg.webp",
    imageMobileUrl: "/hero/srinagar.webp",
  },
  "trip-planner-after-why": {
    label: "bus travel",
    kicker: "Road trips made easy",
    title: "Prefer bus travel?",
    subtitle: "Comfortable seats, trusted operators",
    body: "Volvo and sleeper buses to Jammu and Srinagar — we suggest reliable operators and book seats that fit your plan.",
    features: [
      { icon: "bus", title: "Trusted operators", text: "Volvo & sleeper options" },
      { icon: "ticket", title: "Seat booking", text: "Confirmed seats" },
      { icon: "support", title: "On-trip support", text: "Help along the way" },
    ],
    ctaLabel: "Get Bus Assistance",
    ctaMessage: "Hi! I'd like help booking a bus to Kashmir.",
    imageUrl: "/hero/sonamarg-lg.webp",
    imageMobileUrl: "/hero/sonamarg.webp",
  },
};

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
  const initialIsWhatsApp = isWhatsAppCtaUrl(initial?.ctaUrl ?? null);
  const [ctaType, setCtaType] = useState<"LINK" | "WHATSAPP">(
    initialIsWhatsApp ? "WHATSAPP" : "LINK",
  );
  const [ctaUrl, setCtaUrl] = useState(initialIsWhatsApp ? "" : (initial?.ctaUrl ?? ""));
  const [ctaMessage, setCtaMessage] = useState(
    initialIsWhatsApp ? getWhatsAppCtaMessage(initial!.ctaUrl!) : "",
  );
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [imageMobileUrl, setImageMobileUrl] = useState(initial?.imageMobileUrl ?? "");
  // PROMO presentation — SPLIT adds kicker/subtitle/features in a white or
  // navy content panel beside the image (see SplitPromoCard).
  const [layout, setLayout] = useState<BannerLayout>(initial?.layout ?? "OVERLAY");
  const [contentBackground, setContentBackground] = useState(initial?.contentBackground ?? true);
  const [kicker, setKicker] = useState(initial?.kicker ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [features, setFeatures] = useState<BannerFeature[]>(
    parseBannerFeatures(initial?.features ?? "[]"),
  );
  const isSplit = type === "PROMO" && layout === "SPLIT";

  // The example for the Plan Your Trip slot being targeted (PROMO only), if any.
  const [pages, setPages] = useState<string[]>(initial ? parsePages(initial.pages) : ["*"]);
  const exampleKey = type === "PROMO" ? pages.find((p) => p in TRIP_PLANNER_EXAMPLES) : undefined;
  const example = exampleKey ? TRIP_PLANNER_EXAMPLES[exampleKey] : null;

  // Loads the slot's example into every EMPTY field — never overwrites
  // anything already typed.
  function fillWithExample() {
    if (!example) return;
    if (!title.trim()) setTitle(example.title);
    if (!body.trim()) setBody(example.body);
    if (!ctaLabel.trim()) setCtaLabel(example.ctaLabel);
    if (ctaType === "WHATSAPP" ? !ctaMessage.trim() : !ctaUrl.trim()) {
      setCtaType("WHATSAPP");
      setCtaMessage(example.ctaMessage);
    }
    if (!imageUrl.trim()) setImageUrl(example.imageUrl);
    if (!imageMobileUrl.trim()) setImageMobileUrl(example.imageMobileUrl);
    if (isSplit) {
      if (!kicker.trim()) setKicker(example.kicker);
      if (!subtitle.trim()) setSubtitle(example.subtitle);
      if (!features.some((f) => f.title.trim())) setFeatures(example.features);
    }
    toast.success("Example content added to the empty fields — edit it to suit.");
  }

  function updateFeature(i: number, patch: Partial<BannerFeature>) {
    setFeatures((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [startsAt, setStartsAt] = useState(toDateInput(initial?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toDateInput(initial?.endsAt ?? null));
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  function togglePage(key: string) {
    setPages((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  // The composed value actually stored in Banner.ctaUrl — either a plain
  // link, or "whatsapp:<message>" so the public renderer opens WhatsApp with
  // a proper pre-filled message (see src/lib/whatsappCtaUrl.ts).
  const composedCtaUrl =
    ctaType === "WHATSAPP" ? buildWhatsAppCtaUrl(ctaMessage.trim()) : ctaUrl.trim();

  function submit() {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (pages.length === 0) {
      toast.error("Select at least one page.");
      return;
    }
    if (ctaType === "WHATSAPP" && ctaLabel.trim() && !ctaMessage.trim()) {
      toast.error("Enter a WhatsApp message for the CTA.");
      return;
    }

    const payload = {
      type,
      title: title.trim(),
      body,
      ctaLabel,
      ctaUrl: composedCtaUrl,
      imageUrl: type === "PROMO" ? imageUrl : "",
      imageMobileUrl: type === "PROMO" ? imageMobileUrl : "",
      layout: type === "PROMO" ? layout : "OVERLAY",
      contentBackground,
      kicker: isSplit ? kicker : "",
      subtitle: isSplit ? subtitle : "",
      features: isSplit
        ? features
            .filter((f) => f.title.trim())
            .map((f) => ({
              icon: f.icon,
              title: f.title.trim(),
              text: f.text?.trim() || undefined,
            }))
        : [],
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
  // so the preview is never empty while the admin is still typing. For a
  // Plan Your Trip slot, empty fields preview as that slot's example instead.
  const previewStrip = {
    id: "preview",
    title: title.trim() || "Your announcement headline goes here",
    body: body.trim() || null,
    ctaLabel: ctaLabel.trim() || null,
    ctaUrl: composedCtaUrl || "#",
  };
  const filledFeatures = features.filter((f) => f.title.trim());
  const previewPromo = {
    id: "preview",
    title: title.trim() || example?.title || "Your promo headline",
    body:
      body.trim() ||
      example?.body ||
      "Supporting copy that describes the offer in a sentence or two.",
    ctaLabel: ctaLabel.trim() || example?.ctaLabel || null,
    ctaUrl: composedCtaUrl || "#",
    imageUrl: type === "PROMO" ? imageUrl.trim() || example?.imageUrl || null : null,
    // A typed desktop image with no mobile image falls back to the desktop
    // one (as on the site), rather than to the example's mobile image.
    imageMobileUrl:
      type === "PROMO"
        ? imageMobileUrl.trim() || (imageUrl.trim() ? null : example?.imageMobileUrl || null)
        : null,
    layout,
    contentBackground,
    kicker: kicker.trim() || example?.kicker || null,
    subtitle: subtitle.trim() || example?.subtitle || null,
    features: filledFeatures.length ? filledFeatures : (example?.features ?? []),
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

        {/* PROMO layout */}
        {type === "PROMO" && (
          <div className="space-y-2">
            <label className={labelClass}>Promo layout</label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["OVERLAY", "Image overlay", "Text over a full-width image"],
                  ["SPLIT", "Split content", "Content panel + image, with features"],
                ] as const
              ).map(([value, name, hint]) => (
                <button
                  key={value}
                  type="button"
                  disabled={!canEdit}
                  aria-pressed={layout === value}
                  onClick={() => setLayout(value)}
                  className={cn(
                    "rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition disabled:opacity-60",
                    layout === value
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  <span className="block">{name}</span>
                  <span className="mt-0.5 block text-[12px] font-normal opacity-80">{hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isSplit && (
          <div className="space-y-2">
            <label className={labelClass}>Content background</label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  [true, "With background", "Gold in light mode · navy in dark mode"],
                  [false, "No background", "Content sits directly on the image"],
                ] as const
              ).map(([value, name, hint]) => (
                <button
                  key={String(value)}
                  type="button"
                  disabled={!canEdit}
                  aria-pressed={contentBackground === value}
                  onClick={() => setContentBackground(value)}
                  className={cn(
                    "rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition disabled:opacity-60",
                    contentBackground === value
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {value ? (
                      <span className="flex h-5 w-5 overflow-hidden rounded-full border border-border">
                        <span className="h-full w-1/2 bg-[#F8F1DD]" />
                        <span className="h-full w-1/2 bg-[#0B1F3A]" />
                      </span>
                    ) : (
                      <span className="h-5 w-5 rounded-full border border-dashed border-muted-foreground/60" />
                    )}
                    {name}
                  </span>
                  <span className="mt-0.5 block text-[12px] font-normal opacity-80">{hint}</span>
                </button>
              ))}
            </div>
            <p className={hintClass}>
              {contentBackground
                ? "The panel runs the full banner height in the site's background colour and fades into the image with a gradient — it switches automatically with light/dark mode."
                : "No panel or gradient — pick an image with a clear, darker area on the left so the white text stays readable."}
            </p>
          </div>
        )}

        {isSplit && (
          <div className="space-y-1.5">
            <label htmlFor="bf-kicker" className={labelClass}>
              Kicker <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="bf-kicker"
              className={inputClass}
              value={kicker}
              onChange={(e) => setKicker(e.target.value)}
              disabled={!canEdit}
              maxLength={120}
              placeholder="Travel to Kashmir, your way"
            />
          </div>
        )}

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

        {isSplit && (
          <div className="space-y-1.5">
            <label htmlFor="bf-subtitle" className={labelClass}>
              Subtitle <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="bf-subtitle"
              className={inputClass}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              disabled={!canEdit}
              maxLength={200}
              placeholder="We Help You Plan It All"
            />
          </div>
        )}

        {/* Body */}
        <div className="space-y-1.5">
          <label htmlFor="bf-body" className={labelClass}>
            {isSplit ? "Description" : "Body text"}{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
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

        {/* Features — SPLIT only: icon + heading + optional short line */}
        {isSplit && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={labelClass}>
                Features{" "}
                <span className="font-normal text-muted-foreground">
                  (optional, up to {MAX_BANNER_FEATURES})
                </span>
              </label>
              {canEdit && features.length < MAX_BANNER_FEATURES && (
                <button
                  type="button"
                  onClick={() => setFeatures((f) => [...f, { icon: "plane", title: "", text: "" }])}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80"
                >
                  <Plus className="h-3.5 w-3.5" /> Add feature
                </button>
              )}
            </div>
            {features.length === 0 ? (
              <p className={hintClass}>
                No features — e.g. Flights · Trains · Buses with a short line each.
              </p>
            ) : (
              <div className="space-y-2">
                {features.map((f, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-muted/40 p-3 sm:grid-cols-[140px_1fr_1fr_auto] sm:items-center"
                  >
                    <select
                      className={inputClass}
                      value={f.icon}
                      onChange={(e) => updateFeature(i, { icon: e.target.value })}
                      disabled={!canEdit}
                      aria-label={`Feature ${i + 1} icon`}
                    >
                      {Object.entries(BANNER_ICONS).map(([key, { label }]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <input
                      className={inputClass}
                      value={f.title}
                      onChange={(e) => updateFeature(i, { title: e.target.value })}
                      disabled={!canEdit}
                      maxLength={40}
                      placeholder="Heading — e.g. Flights"
                      aria-label={`Feature ${i + 1} heading`}
                    />
                    <input
                      className={inputClass}
                      value={f.text ?? ""}
                      onChange={(e) => updateFeature(i, { text: e.target.value })}
                      disabled={!canEdit}
                      maxLength={80}
                      placeholder="Short line — e.g. Best routes & fares"
                      aria-label={`Feature ${i + 1} text`}
                    />
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setFeatures((prev) => prev.filter((_, idx) => idx !== i))}
                        aria-label={`Remove feature ${i + 1}`}
                        className="grid h-9 w-9 place-items-center justify-self-end rounded-lg text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="space-y-4">
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

          <div className="space-y-2">
            <label className={labelClass}>CTA opens</label>
            <div className="grid grid-cols-2 gap-2">
              {(["LINK", "WHATSAPP"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={!canEdit}
                  aria-pressed={ctaType === t}
                  onClick={() => setCtaType(t)}
                  className={cn(
                    "rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition disabled:opacity-60",
                    ctaType === t
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  <span className="block">{t === "LINK" ? "A page" : "WhatsApp"}</span>
                  <span className="mt-0.5 block text-[12px] font-normal opacity-80">
                    {t === "LINK" ? "Navigates to a URL" : "Opens chat with a pre-filled message"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {ctaType === "LINK" ? (
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
          ) : (
            <div className="space-y-1.5">
              <label htmlFor="bf-cta-message" className={labelClass}>
                WhatsApp message
              </label>
              <textarea
                id="bf-cta-message"
                className={cn(inputClass, "min-h-[72px] resize-y")}
                value={ctaMessage}
                onChange={(e) => setCtaMessage(e.target.value)}
                disabled={!canEdit}
                placeholder="Hi Vertex Kashmir Holidays! I'd like help with train travel to Kashmir."
              />
              <p className={hintClass}>
                Sent exactly as typed — the phone number and tracking reference are added
                automatically, same as every other WhatsApp button on the site.
              </p>
            </div>
          )}
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
              <p className={hintClass}>
                {isSplit
                  ? "Fills the banner behind the content panel, aligned right — wide art (≈3:1) with the subject on the right works best."
                  : "Full-bleed background. Wide landscape (≈21:9) works best."}
              </p>
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

        {/* Example content — only for promo slots that have one (Plan Your Trip, offer pages) */}
        {example && canEdit && (
          <div className="flex flex-col gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-foreground/80">
              This slot is for <strong>{example.label}</strong>. Empty fields show example content
              in the preview (not saved) — load it into the form to start from it.
            </p>
            <button
              type="button"
              onClick={fillWithExample}
              className="shrink-0 rounded-lg border border-primary px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              Fill with example
            </button>
          </div>
        )}

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

          <p className={hintClass}>
            Updates live as you edit. Mirrors the public site.
            {example && " Empty fields show example content here only — it isn't saved."}
          </p>
        </div>
      </aside>
    </div>
  );
}
