"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { ImageField } from "@/components/admin/pages/ImageField";
import { SectionArrayEditor, type ItemSpec } from "@/components/admin/pages/SectionArrayEditor";
import { CAMPAIGN_JSON_FIELDS } from "@/lib/admin/campaignSchema";

// Per-section structured-editor config for the advanced JSON arrays. Each entry
// maps a campaign JSON field to a friendly label + the shape of one item, so
// staff edit real fields (with gallery-backed image pickers) instead of raw JSON.
const SECTION_SPECS: Record<string, { label: string; description?: string; spec: ItemSpec }> = {
  facts: {
    label: "Facts",
    description: "Short trust facts shown near the hero.",
    spec: { kind: "scalar", type: "text" },
  },
  strip: {
    label: "Strip",
    description: "Scrolling marquee items.",
    spec: { kind: "scalar", type: "text" },
  },
  stats: {
    label: "Stats",
    description: "Headline numbers.",
    spec: { kind: "tuple", fields: [{ label: "Value" }, { label: "Label" }, { label: "Sub" }] },
  },
  highlights: {
    label: "Highlights",
    spec: {
      kind: "object",
      fields: [
        { key: "emoji", label: "Emoji" },
        { key: "title", label: "Title" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "image", label: "Image", type: "image" },
      ],
    },
  },
  activities: {
    label: "Activities",
    spec: {
      kind: "object",
      fields: [
        { key: "title", label: "Title" },
        { key: "image", label: "Image", type: "image" },
      ],
    },
  },
  itinerary: {
    label: "Itinerary",
    spec: {
      kind: "object",
      fields: [
        { key: "title", label: "Title" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "image", label: "Image", type: "image" },
      ],
    },
  },
  tiers: {
    label: "Pricing tiers",
    spec: {
      kind: "object",
      fields: [
        { key: "name", label: "Name" },
        { key: "price", label: "Price", placeholder: "₹28,999" },
        { key: "old", label: "Old price", placeholder: "₹32,999" },
        { key: "tag", label: "Tag", placeholder: "MOST POPULAR" },
        { key: "desc", label: "Description", type: "textarea" },
        { key: "feats", label: "Features (one per line)", type: "stringList" },
      ],
    },
  },
  batches: {
    label: "Departure batches",
    spec: {
      kind: "object",
      fields: [
        { key: "date", label: "Date" },
        { key: "seats", label: "Seats", type: "number" },
        { key: "price", label: "Price" },
        { key: "status", label: "Status", placeholder: "filling | open | sold" },
      ],
    },
  },
  inclusions: { label: "Inclusions", spec: { kind: "scalar", type: "text" } },
  exclusions: { label: "Exclusions", spec: { kind: "scalar", type: "text" } },
  gallery: { label: "Gallery images", spec: { kind: "scalar", type: "image" } },
};

type FieldType = "text" | "textarea" | "image" | "date";
interface F {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
}
interface Group {
  title: string;
  fields: F[];
}

const GROUPS: Group[] = [
  {
    title: "Basics",
    fields: [
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug", placeholder: "winter-special" },
      { key: "badge", label: "Badge" },
      { key: "navCta", label: "Nav CTA" },
      { key: "phone", label: "Phone" },
      { key: "whatsappHref", label: "WhatsApp link" },
      { key: "accent", label: "Accent colour", placeholder: "hsl(196 90% 52%)" },
      { key: "accent2", label: "Accent colour 2", placeholder: "hsl(170 80% 50%)" },
      { key: "particles", label: "Particles", placeholder: "snow" },
    ],
  },
  {
    title: "Hero",
    fields: [
      { key: "titleHtml", label: "Title (HTML)", type: "textarea" },
      { key: "sub", label: "Subtitle", type: "textarea" },
      { key: "heroImage", label: "Hero image", type: "image" },
      { key: "heroImageMobile", label: "Hero image (mobile)", type: "image" },
      { key: "heroCta", label: "Hero CTA" },
      { key: "proofCount", label: "Proof count" },
    ],
  },
  {
    title: "Offer",
    fields: [
      { key: "offerText", label: "Offer text" },
      { key: "offerDeadline", label: "Offer deadline", type: "date" },
      { key: "offerSeats", label: "Offer seats" },
    ],
  },
  {
    title: "Film",
    fields: [
      { key: "filmTitle", label: "Film title" },
      { key: "filmDuration", label: "Film duration" },
      { key: "filmPoster", label: "Film poster", type: "image" },
      { key: "filmSrc", label: "Film source URL" },
    ],
  },
  {
    title: "Section titles & closing",
    fields: [
      { key: "highlightsTitle", label: "Highlights title" },
      { key: "activitiesTitle", label: "Activities title" },
      { key: "itineraryTitle", label: "Itinerary title" },
      { key: "galleryTitle", label: "Gallery title" },
      { key: "faqsTitle", label: "FAQs title" },
      { key: "finalTitle", label: "Final title" },
      { key: "finalSub", label: "Final subtitle", type: "textarea" },
      { key: "finalCta", label: "Final CTA" },
      { key: "finalNote", label: "Final note" },
      { key: "finalImage", label: "Final image", type: "image" },
    ],
  },
  {
    title: "SEO",
    fields: [
      { key: "metaTitle", label: "Meta title" },
      { key: "metaDesc", label: "Meta description", type: "textarea" },
      { key: "ogImage", label: "OG image", type: "image" },
    ],
  },
];

const ALL_FIELDS = GROUPS.flatMap((g) => g.fields);

const inputCls =
  "w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

type CampaignRecord = Record<string, unknown> & { id?: string };

export function CampaignForm({
  initial,
  canEdit,
}: {
  initial: CampaignRecord | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const isNew = !initial?.id;

  const [form, setForm] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    for (const f of ALL_FIELDS) {
      const v = initial?.[f.key];
      base[f.key] =
        v == null
          ? ""
          : f.type === "date"
            ? new Date(v as string).toISOString().slice(0, 10)
            : String(v);
    }
    for (const k of CAMPAIGN_JSON_FIELDS) {
      base[k] = initial?.[k] != null ? String(initial[k]) : "[]";
    }
    return base;
  });
  const [published, setPublished] = useState<boolean>(Boolean(initial?.published));
  const [busy, setBusy] = useState(false);

  function set(key: string, value: string) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  async function save() {
    // Validate JSON array fields up-front.
    for (const k of CAMPAIGN_JSON_FIELDS) {
      try {
        if (!Array.isArray(JSON.parse(form[k] || "[]"))) throw new Error();
      } catch {
        toast.error(`"${k}" must be a valid JSON array.`);
        return;
      }
    }
    if (!form.name || !form.slug) {
      toast.error("Name and slug are required.");
      return;
    }

    const payload: Record<string, unknown> = { published };
    for (const f of ALL_FIELDS) {
      const v = form[f.key];
      payload[f.key] = v === "" ? null : v;
    }
    for (const k of CAMPAIGN_JSON_FIELDS) payload[k] = form[k] || "[]";
    // name/slug must stay non-null strings.
    payload.name = form.name;
    payload.slug = form.slug;

    setBusy(true);
    try {
      const res = await fetch(isNew ? "/api/campaigns" : `/api/campaigns/${initial!.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error?.toString?.() ?? "");
      toast.success(isNew ? "Campaign created." : "Campaign saved.");
      router.push("/admin/campaigns");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <label className="flex w-fit items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 accent-primary"
          disabled={!canEdit}
        />
        Published (visible on the public site)
      </label>

      {GROUPS.map((group) => (
        <div key={group.title} className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-3.5">
            <h3 className="text-sm font-bold text-foreground">{group.title}</h3>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {group.fields.map((f) => (
              <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  {f.label}
                </label>
                {f.type === "image" ? (
                  <ImageField
                    value={form[f.key] ?? ""}
                    onChange={(v) => set(f.key, v)}
                    folder="campaigns"
                  />
                ) : f.type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={form[f.key] ?? ""}
                    placeholder={f.placeholder}
                    disabled={!canEdit}
                    onChange={(e) => set(f.key, e.target.value)}
                    className={inputCls}
                  />
                ) : (
                  <input
                    type={f.type === "date" ? "date" : "text"}
                    value={form[f.key] ?? ""}
                    placeholder={f.placeholder}
                    disabled={!canEdit}
                    onChange={(e) => set(f.key, e.target.value)}
                    className={inputCls}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-3.5">
          <h3 className="text-sm font-bold text-foreground">Sections</h3>
          <p className="text-xs text-muted-foreground">
            Add, remove and reorder items. Image fields pull from the media gallery or upload.
          </p>
        </div>
        <div className="space-y-4 p-5">
          {CAMPAIGN_JSON_FIELDS.map((k) => {
            const cfg = SECTION_SPECS[k];
            if (!cfg) return null;
            return (
              <SectionArrayEditor
                key={k}
                label={cfg.label}
                description={cfg.description}
                value={form[k] ?? "[]"}
                onChange={(json) => set(k, json)}
                spec={cfg.spec}
                folder="campaigns"
                disabled={!canEdit}
              />
            );
          })}
        </div>
      </div>

      {canEdit && (
        // bottom-20 on mobile clears the fixed bottom tab bar (MobileBottomTabs); lg: restores the original offset
        <div className="sticky bottom-20 lg:bottom-4 flex justify-end">
          <button
            onClick={save}
            disabled={busy}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isNew ? "Create campaign" : "Save changes"}
          </button>
        </div>
      )}
    </div>
  );
}
