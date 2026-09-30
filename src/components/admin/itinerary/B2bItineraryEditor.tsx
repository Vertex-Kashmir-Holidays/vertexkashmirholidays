"use client";

// Dedicated editor for B2B itineraries — deliberately NOT the shared
// ItineraryEditor.tsx used by normal customer itineraries. That component's
// visual language (photo-hero cover, per-day/hotel image pickers, Trust
// strip, Activities, arbitrary "detail"/Highlights meta rows) maps to the
// normal ItineraryPdf.tsx, not B2bItineraryPdf.tsx — editing those fields for
// a B2B proposal silently has zero effect on the exported PDF, which is
// exactly the ambiguity this component exists to remove. Every field below
// corresponds 1:1 to something B2bItineraryPdf.tsx actually renders
// (including Included Activities, as compact text cards without photos).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Download, Plus, Trash2 } from "lucide-react";
import { downloadB2bItineraryPdf } from "@/lib/itinerary/export-pdf";
import {
  genId,
  DEFAULT_HOTEL_IMAGES,
  type ItineraryData,
  type ItineraryStatus,
  type ItineraryDay,
  type HotelRow,
} from "@/types/itinerary";
import { applyDayOrder } from "@/lib/itinerary/dayReorder";
import { buildDocumentTitle } from "@/lib/itinerary/documentTitle";
import type { B2bAgentInfo } from "./B2bItineraryPdf";
import { PdfIcon } from "./ItineraryPdf";
import { ReorderableList } from "./ReorderableList";

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";
const card = "rounded-2xl border border-border bg-card p-5 shadow-sm";
const sectionTitle = "font-display text-base font-bold text-foreground";
const fieldLabel = "text-xs font-semibold text-foreground";

function metaValue(day: ItineraryDay, label: string): string {
  return day.meta.find((m) => m.label.trim().toLowerCase() === label)?.value ?? "";
}

function withMetaValue(day: ItineraryDay, label: string, titleLabel: string, value: string): ItineraryDay {
  const idx = day.meta.findIndex((m) => m.label.trim().toLowerCase() === label);
  if (idx === -1) {
    return { ...day, meta: [...day.meta, { id: genId("m"), label: titleLabel, value }] };
  }
  const meta = [...day.meta];
  meta[idx] = { ...meta[idx], value };
  return { ...day, meta };
}

type ListKey = "pay";

interface Props {
  id: string;
  initialData: ItineraryData;
  initialTitle: string;
  initialStatus: ItineraryStatus;
  canSave: boolean;
  apiBasePath: string;
  agent?: B2bAgentInfo | null;
  /** False until the agency has earned full white-label — see WHITE_LABEL_MIN_BOOKINGS. */
  whiteLabel: boolean;
}

export function B2bItineraryEditor({
  id,
  initialData,
  initialTitle,
  initialStatus,
  canSave,
  apiBasePath,
  agent,
  whiteLabel,
}: Props) {
  const router = useRouter();
  const [data, setData] = useState<ItineraryData>(initialData);
  // Standard name (customer name - duration - phone); the server assigns the
  // saved one, which may carry a " (2)" suffix — shown until the next edit.
  const title = data === initialData ? initialTitle : buildDocumentTitle(data);
  const [status, setStatus] = useState<ItineraryStatus>(initialStatus);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  function update<K extends keyof ItineraryData>(field: K, value: ItineraryData[K]) {
    setData((p) => ({ ...p, [field]: value }));
  }

  /* ---------- days ---------- */
  function updateDay(dayId: string, updates: Partial<Pick<ItineraryDay, "title" | "body">>) {
    setData((p) => ({ ...p, days: p.days.map((d) => (d.id === dayId ? { ...d, ...updates } : d)) }));
  }
  function updateDayMeta(dayId: string, key: "stay" | "meals", titleLabel: string, value: string) {
    setData((p) => ({
      ...p,
      days: p.days.map((d) => (d.id === dayId ? withMetaValue(d, key, titleLabel, value) : d)),
    }));
  }
  function addDay() {
    setData((p) => ({
      ...p,
      days: [
        ...p.days,
        {
          id: genId("day"),
          title: "New Day",
          body: "",
          image: "",
          dateLabel: "",
          meta: [
            { id: genId("m"), label: "Stay", value: "" },
            { id: genId("m"), label: "Meals", value: "Breakfast" },
          ],
        },
      ],
    }));
  }
  function removeDay(dayId: string) {
    setData((p) => ({ ...p, days: p.days.filter((d) => d.id !== dayId) }));
  }
  function reorderDays(next: ItineraryDay[]) {
    setData((p) => applyDayOrder(p, next));
  }

  /* ---------- hotels ---------- */
  function updateHotel(
    hid: string,
    field: "destination" | "nights" | "hotelDetails" | "roomType" | "rooms",
    value: string,
  ) {
    setData((p) => ({ ...p, hotels: p.hotels.map((h) => (h.id === hid ? { ...h, [field]: value } : h)) }));
  }
  function addHotel() {
    setData((p) => ({
      ...p,
      hotels: [
        ...p.hotels,
        {
          id: genId("hotel"),
          destination: "",
          hotelDetails: "",
          nights: "1",
          roomType: "",
          rooms: "1",
          mealType: "MAP",
          image: DEFAULT_HOTEL_IMAGES[0],
          extraBed: "0",
          childWithBed: "0",
          hotelAlt: "",
          checkIn: "",
          checkOut: "",
        },
      ],
    }));
  }
  function removeHotel(hid: string) {
    setData((p) => ({ ...p, hotels: p.hotels.filter((h) => h.id !== hid) }));
  }
  function reorderHotels(next: HotelRow[]) {
    setData((p) => ({ ...p, hotels: next }));
  }

  /* ---------- included activities (text cards in the PDF — no photo) ---------- */
  function addActivity() {
    setData((p) => ({
      ...p,
      activities: [
        ...p.activities,
        { id: genId("act"), name: "", place: "", time: "", image: "", day: "" },
      ],
    }));
  }
  function updateActivity(aid: string, field: "name" | "place" | "time" | "day", value: string) {
    setData((p) => ({
      ...p,
      activities: p.activities.map((a) => (a.id === aid ? { ...a, [field]: value } : a)),
    }));
  }
  function removeActivity(aid: string) {
    setData((p) => ({ ...p, activities: p.activities.filter((a) => a.id !== aid) }));
  }

  /* ---------- payment tags (still a plain string[]) ---------- */
  function addListItem(key: ListKey) {
    setData((p) => ({ ...p, [key]: [...p[key], ""] }));
  }
  function updateListItem(key: ListKey, idx: number, value: string) {
    setData((p) => ({ ...p, [key]: p[key].map((v, i) => (i === idx ? value : v)) }));
  }
  function removeListItem(key: ListKey, idx: number) {
    setData((p) => ({ ...p, [key]: p[key].filter((_, i) => i !== idx) }));
  }

  /* ---------- inclusions/exclusions (ListItem rows — B2B only edits `text`,
     `category` stays blank here, same simple one-line-per-row UI as before) ---------- */
  function addListItemRow(key: "inc" | "exc") {
    setData((p) => ({ ...p, [key]: [...p[key], { id: genId("li"), category: "", text: "" }] }));
  }
  function updateListItemText(key: "inc" | "exc", idx: number, value: string) {
    setData((p) => ({
      ...p,
      [key]: p[key].map((v, i) => (i === idx ? { ...v, text: value } : v)),
    }));
  }
  function removeListItemRow(key: "inc" | "exc", idx: number) {
    setData((p) => ({ ...p, [key]: p[key].filter((_, i) => i !== idx) }));
  }

  /* ---------- cancellation tiers (B2B only edits `label`, `charge` stays
     blank — same simple one-line-per-row UI as before) ---------- */
  function addCancelTier() {
    setData((p) => ({ ...p, cancel: [...p.cancel, { id: genId("ct"), label: "", charge: "" }] }));
  }
  function updateCancelLabel(idx: number, value: string) {
    setData((p) => ({
      ...p,
      cancel: p.cancel.map((v, i) => (i === idx ? { ...v, label: value } : v)),
    }));
  }
  function removeCancelTier(idx: number) {
    setData((p) => ({ ...p, cancel: p.cancel.filter((_, i) => i !== idx) }));
  }

  /* ---------- why choose (icon fixed, title/subtitle editable) ---------- */
  function updateWhyChoose(wid: string, field: "title" | "subtitle", value: string) {
    setData((p) => ({
      ...p,
      whyChoose: p.whyChoose.map((w) => (w.id === wid ? { ...w, [field]: value } : w)),
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${apiBasePath}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, data }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      toast.success("Quotation saved.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const { bytes } = await downloadB2bItineraryPdf(data, status, id, agent, whiteLabel);
      toast.success(`PDF downloaded (${Math.round(bytes / 1024)} KB).`);
      // Downloading means it's being shared with the agent — bump a
      // still-draft quotation out of DRAFT, same rule as the normal editor.
      if (status === "DRAFT") {
        const res = await fetch(`${apiBasePath}/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "SENT" }),
        });
        if (res.ok) {
          setStatus("SENT");
          router.refresh();
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PDF export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
        <p
          title="Named automatically from the customer name, duration and phone"
          className="min-w-0 flex-1 basis-[200px] truncate px-2 py-1 text-sm font-bold text-foreground"
        >
          {title}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span
            title={
              whiteLabel
                ? "This agency has earned full white-label — the PDF carries no Vertex mention."
                : "Below the white-label threshold — the PDF stays agent-branded with a small \"Powered by Vertex Kashmir Holidays\" footer credit."
            }
            className={
              "rounded-full px-2.5 py-1 text-[11px] font-bold " +
              (whiteLabel
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-300")
            }
          >
            {whiteLabel ? "White-label" : "Co-branded"}
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ItineraryStatus)}
            className="rounded-lg border border-border bg-card px-2 py-1.5 text-[12px] font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="SENT">SENT</option>
            <option value="CONFIRMED">CONFIRMED</option>
          </select>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] font-bold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            PDF
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !canSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-bold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>
      </div>

      {/* Trip details — maps to B2bItineraryPdf's title + info bar + destinations */}
      <div className={card}>
        <h2 className={sectionTitle}>Trip Details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={fieldLabel}>Package Title</label>
            <input
              className={inputCls + " mt-1.5"}
              value={data.coverTitle}
              onChange={(e) => update("coverTitle", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={fieldLabel}>Subtitle (cover)</label>
            <input
              className={inputCls + " mt-1.5"}
              placeholder="e.g. Autumn Escape"
              value={data.subtitle}
              onChange={(e) => update("subtitle", e.target.value)}
            />
          </div>
          <div>
            <label className={fieldLabel}>Prepared For</label>
            <input
              className={inputCls + " mt-1.5"}
              value={data.preparedFor}
              onChange={(e) => update("preparedFor", e.target.value)}
            />
          </div>
          <div>
            <label className={fieldLabel}>Customer Phone</label>
            <input
              className={inputCls + " mt-1.5"}
              value={data.customerPhone}
              onChange={(e) => update("customerPhone", e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>
          <div>
            <label className={fieldLabel}>Travel Dates</label>
            <input
              className={inputCls + " mt-1.5"}
              value={data.travelDates}
              onChange={(e) => update("travelDates", e.target.value)}
            />
          </div>
          <div>
            <label className={fieldLabel}>Travellers</label>
            <input
              className={inputCls + " mt-1.5"}
              value={data.travelers}
              onChange={(e) => update("travelers", e.target.value)}
            />
          </div>
          <div>
            <label className={fieldLabel}>Duration</label>
            <input
              className={inputCls + " mt-1.5"}
              value={data.duration}
              onChange={(e) => update("duration", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={fieldLabel}>Destinations</label>
            <input
              className={inputCls + " mt-1.5"}
              value={data.destinations}
              onChange={(e) => update("destinations", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Day Plan — maps to the Day Plan at a Glance table (title, body, Stay, Meals only) */}
      <div className={card}>
        <div className="flex items-center justify-between">
          <h2 className={sectionTitle}>Day Plan</h2>
          <button
            type="button"
            onClick={addDay}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add Day
          </button>
        </div>
        <ReorderableList
          items={data.days}
          onReorder={reorderDays}
          noun="day"
          className="mt-4 space-y-4 pl-7"
        >
          {(day, i) => (
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-bold text-primary">DAY {String(i + 1).padStart(2, "0")}</p>
                <button
                  type="button"
                  onClick={() => removeDay(day.id)}
                  aria-label={`Remove day ${i + 1}`}
                  className="text-muted-foreground hover:text-rose-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                className={inputCls + " mt-2"}
                placeholder="Day title"
                value={day.title}
                onChange={(e) => updateDay(day.id, { title: e.target.value })}
              />
              <textarea
                className={inputCls + " mt-2"}
                rows={2}
                placeholder="Plan for the day"
                value={day.body}
                onChange={(e) => updateDay(day.id, { body: e.target.value })}
              />
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <label className={fieldLabel}>Night Stay</label>
                  <input
                    className={inputCls + " mt-1"}
                    value={metaValue(day, "stay")}
                    onChange={(e) => updateDayMeta(day.id, "stay", "Stay", e.target.value)}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Meals</label>
                  <input
                    className={inputCls + " mt-1"}
                    value={metaValue(day, "meals")}
                    onChange={(e) => updateDayMeta(day.id, "meals", "Meals", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </ReorderableList>
      </div>

      {/* Stay Plan — maps to the Stay Plan table (no images) */}
      <div className={card}>
        <div className="flex items-center justify-between">
          <h2 className={sectionTitle}>Stay Plan</h2>
          <button
            type="button"
            onClick={addHotel}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add Hotel
          </button>
        </div>
        <ReorderableList
          items={data.hotels}
          onReorder={reorderHotels}
          noun="hotel"
          className="mt-4 space-y-3 pl-7"
        >
          {(h) => (
            <div
              className="grid grid-cols-2 items-end gap-3 rounded-xl border border-border p-4 sm:grid-cols-[1.6fr_0.7fr_1.8fr_1.2fr_0.8fr_auto]"
            >
              <div>
                <label className={fieldLabel}>Destination</label>
                <input
                  className={inputCls + " mt-1"}
                  value={h.destination}
                  onChange={(e) => updateHotel(h.id, "destination", e.target.value)}
                />
              </div>
              <div>
                <label className={fieldLabel}>Nights</label>
                <input
                  className={inputCls + " mt-1"}
                  value={h.nights}
                  onChange={(e) => updateHotel(h.id, "nights", e.target.value)}
                />
              </div>
              <div>
                <label className={fieldLabel}>Hotel Name</label>
                <input
                  className={inputCls + " mt-1"}
                  value={h.hotelDetails}
                  onChange={(e) => updateHotel(h.id, "hotelDetails", e.target.value)}
                />
              </div>
              <div>
                <label className={fieldLabel}>Room Type</label>
                <input
                  className={inputCls + " mt-1"}
                  value={h.roomType}
                  onChange={(e) => updateHotel(h.id, "roomType", e.target.value)}
                />
              </div>
              <div>
                <label className={fieldLabel}>No. of Rooms</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className={inputCls + " mt-1"}
                  value={h.rooms}
                  onChange={(e) => updateHotel(h.id, "rooms", e.target.value)}
                  onBlur={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!e.target.value.trim() || Number.isNaN(n) || n < 1) {
                      updateHotel(h.id, "rooms", "1");
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => removeHotel(h.id)}
                aria-label="Remove hotel"
                className="mb-0.5 shrink-0 text-muted-foreground hover:text-rose-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </ReorderableList>
      </div>

      {/* Transportation + Price */}
      <div className={card}>
        <h2 className={sectionTitle}>Transportation &amp; Price</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={fieldLabel}>Vehicle</label>
            <input
              className={inputCls + " mt-1.5"}
              value={data.transportType}
              onChange={(e) => update("transportType", e.target.value)}
            />
          </div>
          <div>
            <label className={fieldLabel}>Details</label>
            <input
              className={inputCls + " mt-1.5"}
              value={data.transportDesc}
              onChange={(e) => update("transportDesc", e.target.value)}
            />
          </div>
          <div>
            <label className={fieldLabel}>Total Package Cost</label>
            <input
              className={inputCls + " mt-1.5"}
              placeholder="e.g. Rs. 45,000"
              value={data.totalCost}
              onChange={(e) => update("totalCost", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Included Activities */}
      <div className={card}>
        <div className="flex items-center justify-between">
          <h2 className={sectionTitle}>Included Activities</h2>
          {canSave && (
            <button
              type="button"
              onClick={addActivity}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80"
            >
              <Plus className="h-3.5 w-3.5" /> Add activity
            </button>
          )}
        </div>
        {data.activities.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            No activities — the section is left out of the PDF.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {data.activities.map((a) => (
              <div
                key={a.id}
                className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-muted/40 p-3 sm:grid-cols-[1.3fr_1.3fr_0.8fr_0.7fr_auto] sm:items-center"
              >
                <input
                  className={inputCls}
                  placeholder="Activity — e.g. Shikara Ride"
                  value={a.name}
                  onChange={(e) => updateActivity(a.id, "name", e.target.value)}
                />
                <input
                  className={inputCls}
                  placeholder="Place — e.g. Dal Lake, Srinagar"
                  value={a.place}
                  onChange={(e) => updateActivity(a.id, "place", e.target.value)}
                />
                <input
                  className={inputCls}
                  placeholder="Duration — 1 Hour"
                  value={a.time}
                  onChange={(e) => updateActivity(a.id, "time", e.target.value)}
                />
                <input
                  className={inputCls}
                  placeholder="Day 02"
                  value={a.day}
                  onChange={(e) => updateActivity(a.id, "day", e.target.value)}
                />
                {canSave && (
                  <button
                    type="button"
                    onClick={() => removeActivity(a.id)}
                    aria-label={`Remove activity ${a.name || ""}`}
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

      {/* Inclusions / Exclusions */}
      <div className={card}>
        <h2 className={sectionTitle}>What&apos;s Included, What&apos;s Not</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <ListEditor
            label="Included"
            items={data.inc.map((i) => i.text)}
            onUpdate={(i, v) => updateListItemText("inc", i, v)}
            onRemove={(i) => removeListItemRow("inc", i)}
            onAdd={() => addListItemRow("inc")}
          />
          <ListEditor
            label="Not Included"
            items={data.exc.map((i) => i.text)}
            onUpdate={(i, v) => updateListItemText("exc", i, v)}
            onRemove={(i) => removeListItemRow("exc", i)}
            onAdd={() => addListItemRow("exc")}
          />
        </div>
      </div>

      {/* Payment / Cancellation */}
      <div className={card}>
        <h2 className={sectionTitle}>Terms &amp; Cancellation Policies</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <ListEditor
            label="Payment Policy"
            items={data.pay}
            onUpdate={(i, v) => updateListItem("pay", i, v)}
            onRemove={(i) => removeListItem("pay", i)}
            onAdd={() => addListItem("pay")}
          />
          <ListEditor
            label="Cancellation Policy"
            items={data.cancel.map((c) => c.label)}
            onUpdate={(i, v) => updateCancelLabel(i, v)}
            onRemove={(i) => removeCancelTier(i)}
            onAdd={() => addCancelTier()}
          />
        </div>
      </div>

      {/* Why Travel With Us — icon fixed (same rule as the normal editor's Why Choose Vertex: not user-pickable), title/subtitle editable */}
      {data.whyChoose.length > 0 && (
        <div className={card}>
          <h2 className={sectionTitle}>Why Travel With Us</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.whyChoose.map((w) => (
              <div key={w.id} className="flex gap-3 rounded-xl border border-border p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <PdfIcon icon={w.icon} size={15} solid />
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    className={inputCls}
                    value={w.title}
                    onChange={(e) => updateWhyChoose(w.id, "title", e.target.value)}
                  />
                  <textarea
                    className={inputCls + " mt-1.5"}
                    rows={2}
                    value={w.subtitle}
                    onChange={(e) => updateWhyChoose(w.id, "subtitle", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ListEditor({
  label,
  items,
  onUpdate,
  onRemove,
  onAdd,
}: {
  label: string;
  items: string[];
  onUpdate: (i: number, v: string) => void;
  onRemove: (i: number) => void;
  onAdd: () => void;
}) {
  return (
    <div>
      <p className={fieldLabel}>{label}</p>
      <div className="mt-2 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className={inputCls} value={item} onChange={(e) => onUpdate(i, e.target.value)} />
            <button
              type="button"
              onClick={() => onRemove(i)}
              aria-label={`Remove ${label} item ${i + 1}`}
              className="shrink-0 text-muted-foreground hover:text-rose-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
      >
        <Plus className="h-3.5 w-3.5" /> Add
      </button>
    </div>
  );
}
