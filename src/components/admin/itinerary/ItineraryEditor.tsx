"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Toolbar } from "./Toolbar";
import { ItineraryCover } from "./ItineraryCover";
import { EditableField } from "./EditableField";
import { ImagePicker } from "./ImagePicker";
import { ItineraryIcon } from "./icons";
import { DEFAULT_ITINERARY_DATA } from "./default-data";
import { downloadItineraryPdf } from "@/lib/itinerary/export-pdf";
import {
  type ItineraryData,
  type ItineraryStatus,
  type ItineraryDay,
  genId,
} from "@/types/itinerary";

type ListKey = "inc" | "exc" | "pay" | "cancel";

interface ItineraryEditorProps {
  id?: string;
  initialData: ItineraryData;
  initialTitle: string;
  initialStatus: ItineraryStatus;
  canSave?: boolean;
}

export function ItineraryEditor({ id, initialData, initialTitle, initialStatus, canSave = true }: ItineraryEditorProps) {
  const router = useRouter();
  const [data, setData] = useState<ItineraryData>(initialData);
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<ItineraryStatus>(initialStatus);
  const [isSaving, setSaving] = useState(false);
  const [isExporting, setExporting] = useState(false);

  /* ---------- cover ---------- */
  const updateCover = (field: keyof ItineraryData, value: string) =>
    setData((p) => ({ ...p, [field]: value }));

  /* ---------- info bar ---------- */
  const updateInfo = (id: string, field: "label" | "value", value: string) =>
    setData((p) => ({ ...p, info: p.info.map((it) => (it.id === id ? { ...it, [field]: value } : it)) }));

  /* ---------- days ---------- */
  const updateDay = (dayId: string, updates: Partial<ItineraryDay>) =>
    setData((p) => ({ ...p, days: p.days.map((d) => (d.id === dayId ? { ...d, ...updates } : d)) }));

  const addDay = () =>
    setData((p) => ({
      ...p,
      days: [
        ...p.days,
        { id: genId("day"), title: "New Day", body: "Describe the day's plan…", image: "/itinerary/srinagar.webp", meta: [{ id: genId("m"), label: "Meals", value: "Breakfast" }, { id: genId("m"), label: "Stay", value: "Srinagar" }] },
      ],
    }));

  const removeDay = (dayId: string) =>
    setData((p) => ({ ...p, days: p.days.filter((d) => d.id !== dayId) }));

  const addMeta = (dayId: string) =>
    setData((p) => ({
      ...p,
      days: p.days.map((d) => (d.id === dayId ? { ...d, meta: [...d.meta, { id: genId("m"), label: "Detail", value: "Value" }] } : d)),
    }));

  const updateMeta = (dayId: string, metaId: string, field: "label" | "value", value: string) =>
    setData((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id === dayId ? { ...d, meta: d.meta.map((m) => (m.id === metaId ? { ...m, [field]: value } : m)) } : d,
      ),
    }));

  const removeMeta = (dayId: string, metaId: string) =>
    setData((p) => ({
      ...p,
      days: p.days.map((d) => (d.id === dayId ? { ...d, meta: d.meta.filter((m) => m.id !== metaId) } : d)),
    }));

  /* ---------- hotels ---------- */
  const updateHotel = (hid: string, field: "destination" | "hotelDetails" | "nights" | "roomType", value: string) =>
    setData((p) => ({ ...p, hotels: p.hotels.map((h) => (h.id === hid ? { ...h, [field]: value } : h)) }));

  const addHotel = () =>
    setData((p) => ({ ...p, hotels: [...p.hotels, { id: genId("h"), destination: "New Destination (1N)", hotelDetails: "Hotel name / Similar", nights: "1", roomType: "Double Sharing" }] }));

  const removeHotel = (hid: string) =>
    setData((p) => ({ ...p, hotels: p.hotels.filter((h) => h.id !== hid) }));

  /* ---------- trust ---------- */
  const updateTrust = (tid: string, field: "title" | "subtitle", value: string) =>
    setData((p) => ({ ...p, trust: p.trust.map((t) => (t.id === tid ? { ...t, [field]: value } : t)) }));

  /* ---------- lists ---------- */
  const addListItem = (key: ListKey, item: string) => setData((p) => ({ ...p, [key]: [...p[key], item] }));
  const updateListItem = (key: ListKey, idx: number, value: string) =>
    setData((p) => ({ ...p, [key]: p[key].map((v, i) => (i === idx ? value : v)) }));
  const removeListItem = (key: ListKey, idx: number) =>
    setData((p) => ({ ...p, [key]: p[key].filter((_, i) => i !== idx) }));

  /* ---------- actions ---------- */
  async function handleSave() {
    if (!title.trim()) {
      toast.error("Please enter an itinerary title.");
      return;
    }
    setSaving(true);
    try {
      const payload = { title: title.trim(), status, data };
      const res = await fetch(id ? `/api/itineraries/${id}` : "/api/itineraries", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      toast.success("Itinerary saved.");
      if (!id && json.id) {
        router.replace(`/admin/itinerary/${json.id}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const { bytes } = await downloadItineraryPdf(data);
      const kb = Math.round(bytes / 1024);
      if (bytes > 1024 * 1024) {
        toast.warning(`PDF generated (${(bytes / 1048576).toFixed(2)} MB) — above the 1 MB target.`);
      } else {
        toast.success(`PDF downloaded (${kb} KB).`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PDF export failed");
    } finally {
      setExporting(false);
    }
  }

  function handleReset() {
    if (confirm("Reset all content to the default itinerary? Unsaved changes will be lost.")) {
      setData(DEFAULT_ITINERARY_DATA);
    }
  }

  const greenHead = "font-serif text-2xl font-bold text-[hsl(156_40%_21%)] dark:text-primary";
  const pageCard = "page rounded-xl border border-[hsl(40_14%_87%)] bg-white p-12 shadow-page dark:border-mute/20 dark:bg-card";
  const addBtn = "addbtn mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[hsl(156_40%_21%)]/40 px-3 py-1.5 text-xs font-bold text-[hsl(156_40%_21%)] transition hover:bg-[hsl(150_28%_92%)]/60 dark:border-primary/40 dark:text-primary dark:hover:bg-primary/10 no-print";

  return (
    <div className="pb-8">
      <Toolbar
        title={title}
        onTitleChange={setTitle}
        status={status}
        onStatusChange={setStatus}
        onSave={handleSave}
        onExport={handleExport}
        onReset={handleReset}
        isSaving={isSaving}
        isExporting={isExporting}
        canSave={canSave}
      />

      <div className="py-7">
        <div className="mx-auto max-w-[820px] space-y-8">
          {/* Cover */}
          <ItineraryCover
            data={data}
            onUpdate={(field, value) => updateCover(field, value)}
            onImageChange={(src) => updateCover("coverImage", src)}
          />

          {/* Destinations + Daily Itinerary */}
          <article className={pageCard}>
            <div className="text-center">
              <ItineraryIcon icon="map-pin" className="mx-auto h-7 w-7 text-[hsl(156_40%_21%)] dark:text-primary" />
              <p className="font-serif mt-2 text-xl font-semibold text-ink/70 dark:text-muted-foreground">Destinations</p>
              <EditableField
                value={data.destinations}
                onValueChange={(v) => updateCover("destinations", v)}
                className="font-serif mt-1 text-center text-3xl font-bold text-[hsl(156_40%_21%)] dark:text-primary"
              />
            </div>

            {/* Info bar */}
            <div className="mt-8 grid grid-cols-2 gap-y-6 rounded-2xl border border-[hsl(40_14%_87%)] bg-white px-7 py-7 shadow-soft dark:border-mute/20 dark:bg-card sm:grid-cols-4">
              {data.info.map((it, i) => (
                <div key={it.id} className={`flex flex-col items-center px-4 text-center ${i ? "sm:border-l sm:border-[hsl(40_14%_87%)] dark:sm:border-mute/20" : ""}`}>
                  <ItineraryIcon icon={it.icon} className="h-6 w-6 text-[hsl(156_40%_21%)] dark:text-primary" />
                  <EditableField value={it.value} onValueChange={(v) => updateInfo(it.id, "value", v)} className="mt-2.5 text-center text-sm font-bold" />
                  <EditableField value={it.label} onValueChange={(v) => updateInfo(it.id, "label", v)} className="text-center text-[10.5px] text-mute dark:text-muted-foreground" />
                </div>
              ))}
            </div>

            <div className="mt-10 flex items-center gap-4">
              <h2 className={greenHead}>Daily Itinerary</h2>
              <span className="h-px flex-1 bg-[hsl(40_14%_87%)] dark:bg-mute/20" />
            </div>

            <div className="mt-7 space-y-8">
              {data.days.map((day, dayIdx) => (
                <div key={day.id} className="dayitem group relative flex gap-5">
                  <button onClick={() => removeDay(day.id)} className="absolute -left-2 -top-2 z-20 hidden h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white opacity-0 transition-opacity group-hover:flex group-hover:opacity-100 no-print">
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <div className="flex flex-col items-center">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[hsl(156_40%_21%)] text-center text-white dark:bg-primary">
                      <span className="text-[8px] font-semibold tracking-wide">DAY</span>
                      <span className="text-[15px] font-extrabold">{String(dayIdx + 1).padStart(2, "0")}</span>
                    </span>
                    <span className="dotline mt-1 w-px flex-1" />
                  </div>
                  <div className="flex flex-1 flex-wrap items-start gap-5 pb-2 md:flex-nowrap">
                    <div className="min-w-0 flex-1">
                      <EditableField value={day.title} onValueChange={(v) => updateDay(day.id, { title: v })} className="font-serif text-xl font-bold text-ink dark:text-foreground" />
                      <EditableField value={day.body} onValueChange={(v) => updateDay(day.id, { body: v })} className="mt-1.5 block text-sm leading-relaxed text-ink/70 dark:text-muted-foreground" rows={3} />
                      <div className="mt-4 flex flex-wrap gap-x-9 gap-y-3">
                        {day.meta.map((m) => (
                          <div key={m.id} className="metaitem group/m relative flex items-start gap-2">
                            <button onClick={() => removeMeta(day.id, m.id)} className="absolute -left-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-xs group-hover/m:flex no-print">×</button>
                            <ItineraryIcon icon={m.label.trim().toLowerCase()} className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(156_40%_21%)] dark:text-primary" />
                            <div className="leading-tight">
                              <EditableField value={m.label} onValueChange={(v) => updateMeta(day.id, m.id, "label", v)} className="w-[110px] text-[11px] font-bold" />
                              <EditableField value={m.value} onValueChange={(v) => updateMeta(day.id, m.id, "value", v)} className="w-[150px] text-[11px] text-mute dark:text-muted-foreground" />
                            </div>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addMeta(day.id)} className="addbtn mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[hsl(156_40%_21%)]/40 px-2.5 py-1 text-[10px] font-bold text-[hsl(156_40%_21%)] transition hover:bg-[hsl(150_28%_92%)]/60 dark:border-primary/40 dark:text-primary dark:hover:bg-primary/10 no-print">
                        <Plus className="h-3 w-3" /> detail
                      </button>
                    </div>
                    <div className="relative shrink-0">
                      <ImagePicker value={day.image} onChange={(src) => updateDay(day.id, { image: src })} className="absolute right-2 top-2 z-10" label="Replace" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={day.image} alt={day.title} className="h-[120px] w-full rounded-xl object-cover shadow-soft md:w-[210px]" loading="lazy" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addDay} className="addbtn mt-7 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[hsl(156_40%_21%)]/40 px-4 py-2 text-sm font-bold text-[hsl(156_40%_21%)] transition hover:bg-[hsl(150_28%_92%)]/60 dark:border-primary/40 dark:text-primary dark:hover:bg-primary/10 no-print">
              <Plus className="h-4 w-4" /> Add Day
            </button>

            <Footer />
          </article>

          {/* Accommodation */}
          <article className={pageCard}>
            <div className="flex items-center gap-4">
              <h2 className={greenHead}>Accommodation Info</h2>
              <span className="h-px flex-1 bg-[hsl(40_14%_87%)] dark:bg-mute/20" />
            </div>

            <div className="acc-wrap mt-6 overflow-hidden rounded-xl border border-[hsl(40_14%_87%)] dark:border-mute/20">
              <table className="w-full text-left text-sm">
                <thead className="bg-[hsl(150_28%_92%)] text-xs font-bold text-[hsl(156_40%_21%)] dark:bg-muted/30 dark:text-primary">
                  <tr>
                    <th className="px-5 py-3.5">Destination</th>
                    <th className="px-5 py-3.5">Hotel Details</th>
                    <th className="w-[70px] px-5 py-3.5">Nights</th>
                    <th className="w-[120px] px-5 py-3.5">Room Type</th>
                    <th className="w-10 px-2 no-print"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(40_14%_87%)] dark:divide-mute/20">
                  {data.hotels.map((h, idx) => (
                    <tr key={h.id} className={idx % 2 === 0 ? "bg-white dark:bg-card" : "bg-[hsl(150_28%_92%)]/30 dark:bg-muted/10"}>
                      <td className="px-5 py-3"><EditableField value={h.destination} onValueChange={(v) => updateHotel(h.id, "destination", v)} className="font-semibold" /></td>
                      <td className="px-5 py-3"><EditableField value={h.hotelDetails} onValueChange={(v) => updateHotel(h.id, "hotelDetails", v)} className="text-ink/75 dark:text-muted-foreground" /></td>
                      <td className="px-5 py-3"><EditableField value={h.nights} onValueChange={(v) => updateHotel(h.id, "nights", v)} /></td>
                      <td className="px-5 py-3"><EditableField value={h.roomType} onValueChange={(v) => updateHotel(h.id, "roomType", v)} /></td>
                      <td className="px-2 no-print"><button onClick={() => removeHotel(h.id)} className="text-rose-500 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={addHotel} className={addBtn}><Plus className="h-3 w-3" /> Add Hotel</button>
            <p className="mt-2.5 text-[10.5px] italic text-mute dark:text-muted-foreground">*All accommodations are subject to availability at the time of confirmation.</p>

            <div className="mt-7 grid grid-cols-2 gap-y-6 rounded-2xl bg-[hsl(40_33%_96%)] px-7 py-6 dark:bg-muted/20 sm:grid-cols-4">
              {data.trust.map((t, i) => (
                <div key={t.id} className={`flex flex-col items-center px-3 text-center ${i ? "sm:border-l sm:border-[hsl(40_14%_87%)] dark:sm:border-mute/20" : ""}`}>
                  <ItineraryIcon icon={t.icon} className="h-6 w-6 text-[hsl(156_40%_21%)] dark:text-primary" />
                  <EditableField value={t.title} onValueChange={(v) => updateTrust(t.id, "title", v)} className="mt-2 text-center text-xs font-bold" />
                  <EditableField value={t.subtitle} onValueChange={(v) => updateTrust(t.id, "subtitle", v)} className="text-center text-[10px] leading-snug text-mute dark:text-muted-foreground" />
                </div>
              ))}
            </div>

            <Footer />
          </article>

          {/* Transport + Inclusions/Exclusions */}
          <article className={pageCard}>
            <div className="flex items-center gap-4">
              <h2 className={greenHead}>Transportation Info</h2>
              <span className="h-px flex-1 bg-[hsl(40_14%_87%)] dark:bg-mute/20" />
            </div>
            <div className="mt-6 grid items-center gap-6 sm:grid-cols-[1fr_1.1fr]">
              <div className="flex items-start gap-4">
                <ItineraryIcon icon="car" className="mt-1 h-9 w-9 shrink-0 text-[hsl(156_40%_21%)] dark:text-primary" />
                <div className="min-w-0">
                  <EditableField value={data.transportType} onValueChange={(v) => updateCover("transportType", v)} className="text-base font-bold" />
                  <EditableField value={data.transportDesc} onValueChange={(v) => updateCover("transportDesc", v)} className="mt-1 text-sm text-mute dark:text-muted-foreground" />
                </div>
              </div>
              <div className="relative">
                <ImagePicker value={data.transportImage} onChange={(src) => updateCover("transportImage", src)} className="absolute right-2 top-2 z-10" label="Replace" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.transportImage} alt="Vehicle" className="h-[170px] w-full rounded-xl object-cover shadow-soft" loading="lazy" />
              </div>
            </div>

            <div className="mt-11 grid gap-10 sm:grid-cols-2">
              <ListColumn
                title="Package Inclusions"
                items={data.inc}
                tone="inc"
                onUpdate={(i, v) => updateListItem("inc", i, v)}
                onRemove={(i) => removeListItem("inc", i)}
                onAdd={() => addListItem("inc", "New inclusion item")}
                addLabel="Add inclusion"
              />
              <ListColumn
                title="Package Exclusions"
                items={data.exc}
                tone="exc"
                onUpdate={(i, v) => updateListItem("exc", i, v)}
                onRemove={(i) => removeListItem("exc", i)}
                onAdd={() => addListItem("exc", "New exclusion item")}
                addLabel="Add exclusion"
              />
            </div>

            <Footer />
          </article>

          {/* Terms */}
          <article className={pageCard}>
            <h2 className="font-serif text-3xl font-bold text-[hsl(156_40%_21%)] dark:text-primary">Terms &amp; Policies</h2>
            <div className="mt-8 grid gap-7 sm:grid-cols-2">
              <PolicyCard
                title="Payment Policy"
                items={data.pay}
                onUpdate={(i, v) => updateListItem("pay", i, v)}
                onRemove={(i) => removeListItem("pay", i)}
                onAdd={() => addListItem("pay", "New policy point")}
              />
              <PolicyCard
                title="Cancellation Policy"
                items={data.cancel}
                onUpdate={(i, v) => updateListItem("cancel", i, v)}
                onRemove={(i) => removeListItem("cancel", i)}
                onAdd={() => addListItem("cancel", "New policy point")}
              />
            </div>
            <Footer />
          </article>

          {/* Thank you */}
          <article className="page overflow-hidden rounded-xl border border-[hsl(40_14%_87%)] bg-white shadow-page dark:border-mute/20 dark:bg-card">
            <div className="grid sm:grid-cols-[1.6fr_1fr]">
              <div className="p-10">
                <div className="flex items-center gap-3">
                  <svg viewBox="0 0 44 44" className="h-12 w-12">
                    <path d="M6 9 19 35 22 17Z" fill="#16407f" />
                    <path d="M22 17 25 35 39 9Z" fill="#37b86b" />
                  </svg>
                  <span className="leading-tight">
                    <span className="block font-serif text-2xl font-bold text-ink dark:text-foreground">Vertex</span>
                    <span className="block text-[10px] font-semibold tracking-[0.18em] text-[hsl(156_40%_21%)] dark:text-primary">Kashmir Holidays</span>
                  </span>
                </div>
                <p className="font-serif mt-4 text-xl font-bold text-[hsl(156_40%_21%)] dark:text-primary">Vertex Kashmir Tour &amp; Travel</p>
                <p className="text-sm text-mute dark:text-muted-foreground">J&amp;K Tourism Registration number - JKTA0004560</p>
                <div className="mt-7 space-y-3 text-sm">
                  <p className="flex items-center gap-3"><ItineraryIcon icon="support" className="h-5 w-5 text-[hsl(156_40%_21%)] dark:text-primary" /><span className="font-semibold">+91-7889577789 · +91-9682648388</span></p>
                  <p className="flex items-center gap-3"><ItineraryIcon icon="map-pin" className="h-5 w-5 text-[hsl(156_40%_21%)] dark:text-primary" /><span className="font-semibold">Tangmarg, Gulmarg, India - 193402</span></p>
                  <p className="flex items-center gap-3"><ItineraryIcon icon="calendar" className="h-5 w-5 text-[hsl(156_40%_21%)] dark:text-primary" /><span className="font-semibold">support@vertexkashmirholidays.com</span></p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center bg-[hsl(158_46%_14%)] p-10 text-center text-white dark:bg-primary/20">
                <p className="font-script text-5xl leading-none text-[hsl(146_35%_55%)]">Thank You!</p>
                <p className="mt-4 max-w-[220px] text-sm leading-relaxed text-white/85">We look forward to hosting you in the paradise on earth.</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="print-foot mt-10 border-t border-[hsl(40_14%_87%)] pt-3 text-center text-[9px] tracking-wide text-mute dark:border-mute/20">
      Vertex Kashmir Holidays · Kashmir Escape Itinerary
    </div>
  );
}

function ListColumn({
  title, items, tone, onUpdate, onRemove, onAdd, addLabel,
}: {
  title: string;
  items: string[];
  tone: "inc" | "exc";
  onUpdate: (i: number, v: string) => void;
  onRemove: (i: number) => void;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div>
      <h3 className="font-serif text-[22px] font-bold text-[hsl(156_40%_21%)] dark:text-primary">{title}</h3>
      <ul className="mt-5 space-y-2.5 text-sm text-ink/85 dark:text-muted-foreground">
        {items.map((item, idx) => (
          <li key={idx} className="listrow group relative flex items-start gap-2.5 pr-6">
            <span className={`mt-0.5 flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full text-white ${tone === "inc" ? "bg-[hsl(156_40%_21%)] dark:bg-primary" : "bg-rose-500"}`}>
              <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                {tone === "inc" ? <path d="M20 6 9 17l-5-5" /> : <path d="M18 6 6 18M6 6l12 12" />}
              </svg>
            </span>
            <EditableField value={item} onValueChange={(v) => onUpdate(idx, v)} className="flex-1" />
            <button onClick={() => onRemove(idx)} className="absolute right-0 top-0 hidden text-rose-500 group-hover:block no-print"><Trash2 className="h-3.5 w-3.5" /></button>
          </li>
        ))}
      </ul>
      <button onClick={onAdd} className="addbtn mt-4 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[hsl(156_40%_21%)]/40 px-3 py-1.5 text-xs font-bold text-[hsl(156_40%_21%)] transition hover:bg-[hsl(150_28%_92%)]/60 dark:border-primary/40 dark:text-primary dark:hover:bg-primary/10 no-print">
        <Plus className="h-3 w-3" /> {addLabel}
      </button>
    </div>
  );
}

function PolicyCard({
  title, items, onUpdate, onRemove, onAdd,
}: {
  title: string;
  items: string[];
  onUpdate: (i: number, v: string) => void;
  onRemove: (i: number) => void;
  onAdd: () => void;
}) {
  return (
    <div className="policy-card rounded-2xl border border-[hsl(40_14%_87%)] bg-white p-6 shadow-soft dark:border-mute/20 dark:bg-card">
      <h3 className="text-base font-bold">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-ink/80 dark:text-muted-foreground">
        {items.map((item, idx) => (
          <li key={idx} className="group relative flex items-start gap-2 pr-6">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(156_40%_21%)] dark:bg-primary" />
            <EditableField value={item} onValueChange={(v) => onUpdate(idx, v)} className="flex-1 text-xs" />
            <button onClick={() => onRemove(idx)} className="absolute right-0 top-0 hidden text-rose-500 group-hover:block no-print"><Trash2 className="h-3 w-3" /></button>
          </li>
        ))}
      </ul>
      <button onClick={onAdd} className="addbtn mt-4 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[hsl(156_40%_21%)]/40 px-3 py-1.5 text-xs font-bold text-[hsl(156_40%_21%)] transition hover:bg-[hsl(150_28%_92%)]/60 dark:border-primary/40 dark:text-primary dark:hover:bg-primary/10 no-print">
        <Plus className="h-3 w-3" /> Add point
      </button>
    </div>
  );
}
