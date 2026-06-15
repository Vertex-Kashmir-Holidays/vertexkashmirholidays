"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { ImageField } from "@/components/admin/pages/ImageField";
import { CAMPAIGN_JSON_FIELDS } from "@/lib/admin/campaignSchema";

type FieldType = "text" | "textarea" | "image" | "date";
interface F { key: string; label: string; type?: FieldType; placeholder?: string; }
interface Group { title: string; fields: F[]; }

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

export function CampaignForm({ initial, canEdit }: { initial: CampaignRecord | null; canEdit: boolean }) {
  const router = useRouter();
  const isNew = !initial?.id;

  const [form, setForm] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    for (const f of ALL_FIELDS) {
      const v = initial?.[f.key];
      base[f.key] = v == null ? "" : f.type === "date" ? new Date(v as string).toISOString().slice(0, 10) : String(v);
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
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-primary" disabled={!canEdit} />
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
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">{f.label}</label>
                {f.type === "image" ? (
                  <ImageField value={form[f.key] ?? ""} onChange={(v) => set(f.key, v)} />
                ) : f.type === "textarea" ? (
                  <textarea rows={3} value={form[f.key] ?? ""} placeholder={f.placeholder} disabled={!canEdit} onChange={(e) => set(f.key, e.target.value)} className={inputCls} />
                ) : (
                  <input type={f.type === "date" ? "date" : "text"} value={form[f.key] ?? ""} placeholder={f.placeholder} disabled={!canEdit} onChange={(e) => set(f.key, e.target.value)} className={inputCls} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-3.5">
          <h3 className="text-sm font-bold text-foreground">Sections (advanced)</h3>
          <p className="text-xs text-muted-foreground">Each must be a valid JSON array. See the public campaign page for the expected shape.</p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {CAMPAIGN_JSON_FIELDS.map((k) => (
            <div key={k}>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">{k}</label>
              <textarea rows={4} value={form[k] ?? "[]"} disabled={!canEdit} onChange={(e) => set(k, e.target.value)} className={`${inputCls} font-mono text-xs`} />
            </div>
          ))}
        </div>
      </div>

      {canEdit && (
        <div className="sticky bottom-4 flex justify-end">
          <button onClick={save} disabled={busy} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isNew ? "Create campaign" : "Save changes"}
          </button>
        </div>
      )}
    </div>
  );
}
