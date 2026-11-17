"use client";

import { useCallback, useState } from "react";
import { resyncTripDates } from "@/lib/itinerary/travelDates";
import { withDropOnLastDay } from "@/lib/itinerary/dropDay";
import { stayDateInputValue } from "@/lib/itinerary/stayDate";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Plus, QrCode, Sparkles, BookmarkPlus } from "lucide-react";
import { DayPlanPicker } from "../day-plans/DayPlanPicker";
import { DayPlanFormDialog, EMPTY_DAY_PLAN } from "../day-plans/DayPlanFormDialog";
import { guessRoute } from "@/lib/dayPlans/schema";
import { Toolbar } from "./Toolbar";
import { ItineraryCover } from "./ItineraryCover";
import { LeadTripSync, LinkItineraryPanel } from "./LeadTripSync";
import { EditableField } from "./EditableField";
import { ChipInput } from "./ChipInput";
import { ImagePicker } from "./ImagePicker";
import { ItineraryIcon } from "./icons";
import { ReorderableList } from "./ReorderableList";
import { PriceActivitySection } from "./PriceActivitySection";
import { PDF_CONTACT } from "@/lib/pdf/contact";
import { DEFAULT_ITINERARY_DATA } from "./default-data";
import { downloadItineraryPdf, type TokenPaymentLink } from "@/lib/itinerary/export-pdf";
import { buildDocumentTitle, isCopyTitle } from "@/lib/itinerary/documentTitle";
import { UntouchedCopyGuard } from "./UntouchedCopyGuard";
import { PublishBar, publishTo, type PublishState } from "./PublishBar";
import { applyDayOrder } from "@/lib/itinerary/dayReorder";
import type { PdfTrustContent } from "@/lib/itinerary/pdfTrustContent";
import type { PdfSocialLinks } from "@/lib/pdf/contact";
import { applyLeadFactsToItinerary, type LeadItinerarySeed } from "@/lib/itinerary/lead-defaults";
import {
  type ItineraryData,
  type ItineraryStatus,
  type ItineraryDay,
  type HotelRow,
  type ListItem,
  type CancelTier,
  DEFAULT_HOTEL_IMAGES,
  genId,
} from "@/types/itinerary";

type ListKey = "pay";
/** Category + text row lists (same ListItem shape, same editor component). */
type CategoryListKey = "inc" | "exc" | "checklist";

// Must match MAX_HIGHLIGHTS in ItineraryPdf.tsx — that's what the PDF export
// actually renders/truncates to, so the editor enforces the same cap up
// front rather than silently dropping a 5th+ point only at export time.
const MAX_HIGHLIGHTS = 4;

/** Structured lead data for the two-way trip-detail sync (lead-linked itineraries). */
export interface LeadSyncData {
  leadId: string;
  name: string;
  tourTitle: string | null;
  adults: number;
  children: number | null;
  startDate: string; // yyyy-mm-dd or ""
  endDate: string; // yyyy-mm-dd or ""
}

interface ItineraryEditorProps {
  id?: string;
  initialData: ItineraryData;
  initialTitle: string;
  initialStatus: ItineraryStatus;
  canSave?: boolean;
  /** Current user authored this record and may edit + delete it — see UntouchedCopyGuard. */
  ownsCopy?: boolean;
  leadSync?: LeadSyncData;
  /** Website-booking itineraries — total cost is fixed at checkout, show as read-only. */
  lockCost?: boolean;
  /** This itinerary is linked to a direct booking — customer name stays in sync with it. */
  isBookingLinked?: boolean;
  /** Resolved Corporate Office (or Registered Office fallback) — see companyOffice.ts. */
  companyAddress?: string;
  /** Real review-rating + Why Choose Vertex copy for the PDF — see pdfTrustContent.ts. */
  trustContent?: PdfTrustContent;
  /** Real Instagram/Facebook/YouTube URLs (SiteSettings) — makes the PDF's social icons clickable. */
  socialLinks?: PdfSocialLinks;
  /**
   * Save/status-bump endpoint prefix — defaults to the generic staff itinerary
   * API. B2B itineraries (see /admin/b2b-itineraries/[id]/page.tsx) pass
   * "/api/admin/b2b-itineraries" instead, since the generic route's
   * resolveItineraryAccess() is assignee-gated and B2B requests have no
   * assignee concept — nothing else about this component changes.
   */
  apiBasePath?: string;
  /**
   * B2B itineraries have no booking/payment concept yet — suppresses the
   * token-Payment-Link QR mint on export rather than relying on it to fail.
   */
  disableTokenPaymentLink?: boolean;
  /** When the client-visible copy was last published (ISO), or null if never — see src/lib/itinerary/publish.ts. */
  initialPublishedAt?: string | null;
  /** Last server save (ISO) — compared with initialPublishedAt for "unpublished changes". */
  initialUpdatedAt?: string;
  /** Destinations Library access: pick a day heading/description / save a day to the library. */
  dayPlans?: { canPick: boolean; canSave: boolean };
}

export function ItineraryEditor({
  id,
  initialData,
  initialTitle,
  initialStatus,
  canSave = true,
  ownsCopy = false,
  leadSync,
  isBookingLinked = false,
  lockCost = false,
  companyAddress,
  trustContent,
  socialLinks,
  apiBasePath = "/api/itineraries",
  disableTokenPaymentLink = false,
  initialPublishedAt = null,
  initialUpdatedAt,
  dayPlans = { canPick: false, canSave: false },
}: ItineraryEditorProps) {
  const router = useRouter();
  const [data, setRawData] = useState<ItineraryData>(initialData);
  // Every edit goes through resyncTripDates: day dates and hotel check-in/out follow the
  // travel start date, nights and hotel order (manual tweaks stay otherwise).
  // Adding/removing/reordering days also moves the "Drop" detail onto the
  // new last day (withDropOnLastDay); ordinary edits leave days alone.
  const setData = useCallback(
    (update: ItineraryData | ((prev: ItineraryData) => ItineraryData)) =>
      setRawData((prev) => {
        let next = typeof update === "function" ? update(prev) : update;
        const ids = (d: ItineraryData) => d.days.map((x) => x.id).join("|");
        if (ids(prev) !== ids(next)) next = { ...next, days: withDropOnLastDay(next.days) };
        return resyncTripDates(prev, next);
      }),
    [],
  );
  // Every itinerary is named "<customer> - <duration> - <phone>" from its own
  // content; the API derives the same string on save (a lead/booking-linked
  // one may get a " (2)" suffix there — shown until the next edit).
  const displayTitle = id && data === initialData ? initialTitle : buildDocumentTitle(data);
  const [status, setStatus] = useState<ItineraryStatus>(initialStatus);
  const [isSaving, setSaving] = useState(false);
  const [isExporting, setExporting] = useState(false);

  // Client visibility: customers only see the published snapshot. `savedData`
  // is the last server-saved content, so `data !== savedData` = unsaved edits.
  const [savedData, setSavedData] = useState<ItineraryData>(initialData);
  const [savedAt, setSavedAt] = useState<string | undefined>(initialUpdatedAt);
  const [publishedAt, setPublishedAt] = useState<string | null>(initialPublishedAt);
  const publishState: PublishState = !publishedAt
    ? "never"
    : savedAt && new Date(savedAt) > new Date(publishedAt)
      ? "stale"
      : "current";
  const publishUrl = id ? `${apiBasePath}/${id}/publish` : null;

  /** After a save/download: nudge staff that the customer can't see this yet. */
  function promptPublish(message: string) {
    if (!publishUrl || !canSave) return;
    toast.info(message, {
      duration: 10000,
      action: {
        label: "Publish to customer",
        onClick: async () => {
          const at = await publishTo(publishUrl);
          if (!at) return;
          setPublishedAt(at);
          setSavedAt(at);
          toast.success("Published — the customer now sees this version.");
          router.refresh();
        },
      },
    });
  }

  /* ---------- cover ---------- */
  const updateCover = (field: keyof ItineraryData, value: string) =>
    setData((p) => ({ ...p, [field]: value }));
  const updateExtraVehicle = (
    id: string,
    patch: Partial<ItineraryData["extraVehicles"][number]>,
  ) =>
    setData((p) => ({
      ...p,
      extraVehicles: p.extraVehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    }));

  /* ---------- lead trip sync (two-way) ---------- */
  // Recompute the lead-derived cover/duration fields live when trip details change.
  const handleLeadFacts = (facts: LeadItinerarySeed) =>
    setData((p) => applyLeadFactsToItinerary(p, facts));

  /* ---------- info bar ---------- */
  const updateInfo = (id: string, field: "label" | "value", value: string) =>
    setData((p) => ({
      ...p,
      info: p.info.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    }));

  /* ---------- days ---------- */
  const updateDay = (dayId: string, updates: Partial<ItineraryDay>) =>
    setData((p) => ({
      ...p,
      days: p.days.map((d) => (d.id === dayId ? { ...d, ...updates } : d)),
    }));

  // New days go in before the last day, which stays the departure (Drop) day.
  const addDay = () =>
    setData((p) => {
      const day: ItineraryDay = {
        id: genId("day"),
        title: "New Day",
        body: "Describe the day's plan…",
        image: "/itinerary/srinagar.webp",
        dateLabel: "",
        meta: [
          { id: genId("m"), label: "Meals", value: "Breakfast" },
          { id: genId("m"), label: "Stay", value: "Srinagar" },
        ],
      };
      const at = Math.max(0, p.days.length - 1);
      return { ...p, days: [...p.days.slice(0, at), day, ...p.days.slice(at)] };
    });

  const removeDay = (dayId: string) =>
    setData((p) => ({ ...p, days: p.days.filter((d) => d.id !== dayId) }));
  const reorderDays = (next: ItineraryDay[]) => setData((p) => applyDayOrder(p, next));

  // Destinations Library — a picked plan replaces ONLY the day's heading and
  // description (meals, stay, highlights, photo and date untouched); the copy
  // is this itinerary's own and never changes the library. Same as proposals.
  const [pickForDay, setPickForDay] = useState<string | null>(null);
  const [saveDay, setSaveDay] = useState<ItineraryDay | null>(null);

  const addMeta = (dayId: string) =>
    setData((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id === dayId
          ? { ...d, meta: [...d.meta, { id: genId("m"), label: "Detail", value: "Value" }] }
          : d,
      ),
    }));

  const updateMeta = (dayId: string, metaId: string, field: "label" | "value", value: string) =>
    setData((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id === dayId
          ? { ...d, meta: d.meta.map((m) => (m.id === metaId ? { ...m, [field]: value } : m)) }
          : d,
      ),
    }));

  const metaKey = (m: { label: string }) => m.label.trim().toLowerCase();
  // Sets a fixed detail (Stay / Drop / Meals) by label, adding it if the day lacks one.
  const setMetaValue = (dayId: string, label: string, value: string) =>
    setData((p) => ({
      ...p,
      days: p.days.map((d) => {
        if (d.id !== dayId) return d;
        const has = d.meta.some((m) => metaKey(m) === label.toLowerCase());
        return {
          ...d,
          meta: has
            ? d.meta.map((m) => (metaKey(m) === label.toLowerCase() ? { ...m, value } : m))
            : [...d.meta, { id: genId("m"), label, value }],
        };
      }),
    }));

  const removeMeta = (dayId: string, metaId: string) =>
    setData((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id === dayId ? { ...d, meta: d.meta.filter((m) => m.id !== metaId) } : d,
      ),
    }));

  /* ---------- highlights (a meta row's value, comma-joined — same convention
     the PDF export reads via MAX_HIGHLIGHTS in ItineraryPdf.tsx) ---------- */
  const parseHighlights = (value: string) =>
    value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const addHighlightPoint = (dayId: string, metaId: string, currentValue: string) => {
    const points = parseHighlights(currentValue);
    if (points.length >= MAX_HIGHLIGHTS) return;
    updateMeta(dayId, metaId, "value", [...points, "New highlight"].join(", "));
  };

  const updateHighlightPoint = (
    dayId: string,
    metaId: string,
    currentValue: string,
    index: number,
    value: string,
  ) => {
    const points = parseHighlights(currentValue);
    points[index] = value;
    updateMeta(dayId, metaId, "value", points.join(", "));
  };

  const removeHighlightPoint = (
    dayId: string,
    metaId: string,
    currentValue: string,
    index: number,
  ) => {
    const points = parseHighlights(currentValue).filter((_, i) => i !== index);
    updateMeta(dayId, metaId, "value", points.join(", "));
  };

  /* ---------- hotels ---------- */
  const updateHotel = (
    hid: string,
    field:
      | "destination"
      | "hotelDetails"
      | "nights"
      | "roomType"
      | "rooms"
      | "mealType"
      | "image"
      | "extraBed"
      | "childWithoutBed"
      | "hotelAlt"
      | "checkIn"
      | "checkOut",
    value: string,
  ) =>
    setData((p) => ({
      ...p,
      hotels: p.hotels.map((h) => (h.id === hid ? { ...h, [field]: value } : h)),
    }));

  const addHotel = () =>
    setData((p) => ({
      ...p,
      hotels: [
        ...p.hotels,
        {
          id: genId("h"),
          destination: "New Destination (1N)",
          hotelDetails: "Hotel name",
          hotelAlt: "or similar category",
          checkIn: "",
          checkOut: "",
          nights: "1",
          roomType: "Double Sharing",
          rooms: "1",
          mealType: "MAP",
          image: DEFAULT_HOTEL_IMAGES[0],
          extraBed: "0",
          childWithoutBed: "0",
        },
      ],
    }));

  const removeHotel = (hid: string) =>
    setData((p) => ({ ...p, hotels: p.hotels.filter((h) => h.id !== hid) }));
  const reorderHotels = (next: HotelRow[]) => setData((p) => ({ ...p, hotels: next }));

  /* ---------- activities ---------- */
  const updateActivity = (
    aid: string,
    field: "name" | "place" | "time" | "image" | "day",
    value: string,
  ) =>
    setData((p) => ({
      ...p,
      activities: p.activities.map((a) => (a.id === aid ? { ...a, [field]: value } : a)),
    }));

  // Always available regardless of current count — an itinerary can go down
  // to zero activities (section just disappears from the PDF) and still add
  // more afterward.
  const addActivity = () =>
    setData((p) => ({
      ...p,
      activities: [
        ...p.activities,
        {
          id: genId("act"),
          name: "New Activity",
          place: "Destination",
          time: "Duration",
          image: "/itinerary/shikara.webp",
          day: "",
        },
      ],
    }));

  const removeActivity = (aid: string) =>
    setData((p) => ({ ...p, activities: p.activities.filter((a) => a.id !== aid) }));

  /* ---------- optional activities / local taxis (shared priceActivitySchema) ---------- */
  const updatePriceActivity = (
    key: "optionalActivities" | "localTaxis",
    id: string,
    field: "name" | "place" | "day" | "note" | "price",
    value: string,
  ) =>
    setData((p) => ({
      ...p,
      [key]: p[key].map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    }));

  const addPriceActivity = (key: "optionalActivities" | "localTaxis") =>
    setData((p) => ({
      ...p,
      [key]: [
        ...p[key],
        { id: genId("pa"), name: "New Item", place: "", day: "", note: "", price: "" },
      ],
    }));

  const removePriceActivity = (key: "optionalActivities" | "localTaxis", id: string) =>
    setData((p) => ({ ...p, [key]: p[key].filter((a) => a.id !== id) }));

  /* ---------- trust ---------- */
  const updateTrust = (tid: string, field: "title" | "subtitle", value: string) =>
    setData((p) => ({
      ...p,
      trust: p.trust.map((t) => (t.id === tid ? { ...t, [field]: value } : t)),
    }));

  /* ---------- why choose vertex ---------- */
  const updateWhyChoose = (wid: string, field: "title" | "subtitle", value: string) =>
    setData((p) => ({
      ...p,
      whyChoose: p.whyChoose.map((w) => (w.id === wid ? { ...w, [field]: value } : w)),
    }));

  /* ---------- pay tags (plain string[]) ---------- */
  const addListItem = (key: ListKey, item: string) =>
    setData((p) => ({ ...p, [key]: [...p[key], item] }));
  const updateListItem = (key: ListKey, idx: number, value: string) =>
    setData((p) => ({ ...p, [key]: p[key].map((v, i) => (i === idx ? value : v)) }));
  const removeListItem = (key: ListKey, idx: number) =>
    setData((p) => ({ ...p, [key]: p[key].filter((_, i) => i !== idx) }));

  /* ---------- inclusions/exclusions/check list (category + text rows) ---------- */
  const addListItemRow = (key: CategoryListKey) =>
    setData((p) => ({ ...p, [key]: [...p[key], { id: genId("li"), category: "", text: "" }] }));
  const updateListItemRow = (
    key: CategoryListKey,
    id: string,
    field: "category" | "text",
    value: string,
  ) =>
    setData((p) => ({
      ...p,
      [key]: p[key].map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    }));
  const removeListItemRow = (key: CategoryListKey, id: string) =>
    setData((p) => ({ ...p, [key]: p[key].filter((v) => v.id !== id) }));

  /* ---------- cancellation tiers (label + charge rows) ---------- */
  const addCancelTier = () =>
    setData((p) => ({ ...p, cancel: [...p.cancel, { id: genId("ct"), label: "", charge: "" }] }));
  const updateCancelTier = (id: string, field: "label" | "charge", value: string) =>
    setData((p) => ({
      ...p,
      cancel: p.cancel.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    }));
  const removeCancelTier = (id: string) =>
    setData((p) => ({ ...p, cancel: p.cancel.filter((v) => v.id !== id) }));

  /* ---------- actions ---------- */
  async function handleSave(opts: { promptPublish?: boolean } = { promptPublish: true }): Promise<boolean> {
    if (!data.preparedFor.trim()) {
      toast.error("Please enter the customer name (Prepared For).");
      return false;
    }
    setSaving(true);
    try {
      const payload = { status, data };
      const res = await fetch(id ? `${apiBasePath}/${id}` : apiBasePath, {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setSavedData(data);
      setSavedAt(json.updatedAt ?? new Date().toISOString());
      if (!id && json.id) {
        toast.success("Itinerary saved.");
        router.replace(`/admin/itinerary/${json.id}`);
      } else {
        if (opts.promptPublish) {
          promptPublish(
            publishedAt
              ? "Saved. The customer still sees the previously published version."
              : "Saved. The customer can't see this itinerary until you publish it.",
          );
        } else {
          toast.success("Itinerary saved.");
        }
        router.refresh();
      }
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      // Resolve (reuse or mint) this itinerary's token Payment Link first —
      // needs a saved itinerary id. An unsaved draft simply exports without a
      // QR (see downloadItineraryPdf) rather than blocking export.
      let tokenPaymentLink: TokenPaymentLink | undefined;
      if (id && !disableTokenPaymentLink) {
        try {
          const res = await fetch(`${apiBasePath}/${id}/token-payment-link`, { method: "POST" });
          const json = await res.json().catch(() => ({}));
          if (res.ok) {
            tokenPaymentLink = { shortUrl: json.shortUrl, amountRupees: json.amountRupees, totalRupees: json.totalRupees };
          } else {
            toast.warning(json.error ?? "Could not generate the payment QR — exporting without it.");
          }
        } catch {
          toast.warning("Could not generate the payment QR — exporting without it.");
        }
      }

      const { bytes } = await downloadItineraryPdf(
        data,
        companyAddress,
        tokenPaymentLink,
        trustContent,
        socialLinks,
      );
      const kb = Math.round(bytes / 1024);
      if (bytes > 1024 * 1024) {
        toast.warning(
          `PDF generated (${(bytes / 1048576).toFixed(2)} MB) — above the 1 MB target.`,
        );
      } else {
        toast.success(`PDF downloaded (${kb} KB).`);
      }
      // Downloading no longer shares it automatically — the customer's account
      // only shows what's explicitly published (src/lib/itinerary/publish.ts).
      // Nudge instead when their copy is missing or behind.
      if (data !== savedData) {
        toast.info("This PDF includes unsaved changes — save and publish to update the customer's account.");
      } else if (publishState !== "current") {
        promptPublish(
          publishedAt
            ? "The customer's account still shows the older published version."
            : "The customer can't see this itinerary in their account until you publish it.",
        );
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
  const pageCard =
    "page rounded-xl border border-[hsl(40_14%_87%)] bg-white p-5 shadow-page dark:border-mute/20 dark:bg-card sm:p-8 md:p-12";
  const addBtn =
    "addbtn mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[hsl(156_40%_21%)]/40 px-3 py-1.5 text-xs font-bold text-[hsl(156_40%_21%)] transition hover:bg-[hsl(150_28%_92%)]/60 dark:border-primary/40 dark:text-primary dark:hover:bg-primary/10 no-print";
  const fieldLabel =
    "block text-[11px] font-semibold uppercase tracking-wide text-mute dark:text-muted-foreground mb-1";
  const numberInputCls =
    "w-full rounded-md border border-[hsl(40_14%_87%)]/80 bg-transparent px-2 py-1 text-sm outline-none max-md:text-[16px] transition-all focus:bg-muted/30 focus:ring-1 focus:ring-primary/30 dark:border-white/10 print:border-none print:bg-transparent print:p-0 print:focus:ring-0";
  // Same box without w-full, for inputs sized by their row (day details).
  const inlineInputCls = numberInputCls.replace("w-full ", "");

  return (
    <div className="pb-8">
      <Toolbar
        title={displayTitle}
        status={status}
        onStatusChange={setStatus}
        onSave={() => void handleSave()}
        onExport={handleExport}
        onReset={handleReset}
        isSaving={isSaving}
        isExporting={isExporting}
        canSave={canSave}
      />
      {publishUrl && (
        <PublishBar
          publishUrl={publishUrl}
          audience="customer"
          state={publishState}
          publishedAt={publishedAt}
          dirty={data !== savedData}
          onSave={() => handleSave({ promptPublish: false })}
          canPublish={canSave}
          onPublished={(at) => {
            setPublishedAt(at);
            setSavedAt(at);
          }}
        />
      )}
      {id && (
        <UntouchedCopyGuard
          active={ownsCopy && isCopyTitle(initialTitle)}
          deleteUrl={`${apiBasePath}/${id}`}
          noun="itinerary"
        />
      )}

      <div className="px-3 py-7 sm:px-5">
        <div className="mx-auto max-w-[920px] space-y-8">
          {/* Lead trip-detail sync (lead-linked itineraries) — or, for a
              standalone itinerary that hasn't been linked to anything yet,
              a panel to attach it to an existing lead/booking. */}
          {canSave &&
            (leadSync ? (
              <LeadTripSync leadId={leadSync.leadId} initial={leadSync} onFacts={handleLeadFacts} />
            ) : (
              !isBookingLinked && id && <LinkItineraryPanel itineraryId={id} />
            ))}

          {/* Cover */}
          <ItineraryCover
            data={data}
            onUpdate={(field, value) => updateCover(field, value)}
            onImageChange={(src) => updateCover("coverImage", src)}
            readOnlyDerived={!!leadSync}
            nameLocked={leadSync ? "lead" : isBookingLinked ? "booking" : null}
            lockCost={lockCost}
          />

          {/* Destinations + Daily Itinerary */}
          <article className={pageCard}>
            {/* Destinations full width, then the other info[] rows — plain
                label + input like the other cards (the PDF keeps its own
                card layout). */}
            <div>
              <p className={fieldLabel}>Destinations</p>
              <EditableField
                value={data.destinations}
                onValueChange={(v) => updateCover("destinations", v)}
                className="border border-[hsl(40_14%_87%)]/80 px-2 py-1 text-lg dark:border-white/10 print:border-none font-bold text-[#0F2A1E] dark:text-primary"
              />
            </div>
            {/* Phones: one field per row, full width. sm+: side by side. */}
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {data.info.map((it) => (
                <div key={it.id}>
                  <input
                    value={it.label}
                    onChange={(e) => updateInfo(it.id, "label", e.target.value)}
                    aria-label="Label"
                    className={`${fieldLabel} w-full bg-transparent outline-none focus:ring-1 focus:ring-primary/30`}
                  />
                  <input
                    value={it.value}
                    onChange={(e) => updateInfo(it.id, "value", e.target.value)}
                    aria-label={it.label}
                    className={`${numberInputCls} font-bold text-[#0F2A1E] dark:text-foreground`}
                  />
                </div>
              ))}
            </div>

            <div className="mt-10 flex items-center gap-4">
              <h2 className={greenHead}>Daily Itinerary</h2>
              <span className="h-px flex-1 bg-[hsl(40_14%_87%)] dark:bg-mute/20" />
            </div>

            <ReorderableList
              items={data.days}
              onReorder={reorderDays}
              noun="day"
              className="mt-7 space-y-4"
            >
              {(day, dayIdx) => (
                <div
                  className="dayitem group relative flex flex-col rounded-xl border border-[#DCE7E0] dark:border-mute/20"
                >
                  <button
                    onClick={() => removeDay(day.id)}
                    aria-label={`Remove day ${dayIdx + 1}`}
                    className="absolute -left-2 -top-2 z-20 hidden h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white opacity-0 transition-opacity group-hover:flex group-hover:opacity-100 no-print [@media(hover:none)]:flex [@media(hover:none)]:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>

                  <div className="flex flex-col sm:flex-row sm:items-stretch">
                  {/* Content — matches the PDF's day card: big light numeral +
                      title + date on one line, description, highlight pills,
                      then a meals/stay icon row. No colored header bar or
                      boxed highlights panel anymore — same plain card the
                      PDF now uses. */}
                  <div className="min-w-0 flex-1 p-4">
                    {/* Phones: title, then the date on its own line under it.
                        sm+: date on the right of the title, as before. */}
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                      <div className="flex min-w-0 flex-1 items-baseline gap-2">
                        <span className="w-9 shrink-0 font-serif text-2xl font-bold text-[#B8D4C4] sm:w-auto">
                          {String(dayIdx + 1).padStart(2, "0")}
                        </span>
                        <EditableField
                          value={day.title}
                          onValueChange={(v) => updateDay(day.id, { title: v })}
                          className="min-w-0 flex-1 font-serif text-base font-bold text-[#0F2A1E] dark:text-foreground"
                        />
                      </div>
                      {/* Filled from the travel start date (resyncTripDates); blank = not printed. */}
                      <input
                        type="date"
                        aria-label={`Day ${dayIdx + 1} date`}
                        value={stayDateInputValue(day.dateLabel)}
                        onChange={(e) => updateDay(day.id, { dateLabel: e.target.value })}
                        className="ml-12 w-36 text-xs text-[#6B7C73] dark:text-muted-foreground sm:ml-0 sm:shrink-0 rounded-md border border-[hsl(40_14%_87%)]/80 bg-transparent px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary/30 dark:border-white/10"
                      />
                    </div>
                    <EditableField
                      value={day.body}
                      onValueChange={(v) => updateDay(day.id, { body: v })}
                      className="mt-2 block text-sm leading-relaxed text-[#3D4F45] dark:text-muted-foreground"
                      rows={3}
                    />

                    {/* Always shown — a day with no highlights yet (e.g. converted
                        from a single-package proposal, which has none) still
                        gets the box and "+ point" creates the Highlights detail. */}
                    {(() => {
                      const m = day.meta.find((x) => metaKey(x) === "highlights");
                      const highlightPoints = m ? parseHighlights(m.value) : [];
                      return (
                        <div className="mt-3">
                          <label className={fieldLabel}>Highlights</label>
                          {m && highlightPoints.length > 0 ? (
                            <div className="grid gap-2 sm:grid-cols-2">
                              {highlightPoints.map((point, i) => (
                                <ChipInput
                                  key={i}
                                  value={point}
                                  onChange={(v) => updateHighlightPoint(day.id, m.id, m.value, i, v)}
                                  onRemove={() => removeHighlightPoint(day.id, m.id, m.value, i)}
                                  label={`Highlight ${i + 1}`}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              None yet — add up to {MAX_HIGHLIGHTS}, e.g. Dal Lake, Mughal Gardens.
                            </p>
                          )}
                          {highlightPoints.length < MAX_HIGHLIGHTS && (
                            <button
                              onClick={() =>
                                m
                                  ? addHighlightPoint(day.id, m.id, m.value)
                                  : setMetaValue(day.id, "Highlights", "New highlight")
                              }
                              className={addBtn}
                            >
                              <Plus className="h-2.5 w-2.5" /> point
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    {/* Stay (Drop on the last day) then Meals — fixed labels like
                        the proposal. Any other custom detail keeps an editable
                        label below. */}
                    <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#EDF3EF] pt-3 dark:border-mute/20">
                      {(() => {
                        const stayLabel = day.meta.some((m) => metaKey(m) === "drop") ? "Drop" : "Stay";
                        return (["stay", "meals"] as const).map((k) => {
                          const label = k === "stay" ? stayLabel : "Meals";
                          const m = day.meta.find((x) => metaKey(x) === label.toLowerCase());
                          return (
                            <div key={k} className="min-w-0">
                              <label className={fieldLabel}>{label}</label>
                              <input
                                value={m?.value ?? ""}
                                onChange={(e) => setMetaValue(day.id, label, e.target.value)}
                                placeholder={k === "stay" ? (label === "Drop" ? "Srinagar Airport" : "Srinagar") : "Breakfast, Dinner"}
                                className={numberInputCls}
                              />
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                      {day.meta
                        .filter((m) => !["highlights", "stay", "drop", "meals"].includes(metaKey(m)))
                        .map((m) => (
                          <div
                            key={m.id}
                            className="metaitem group/m relative flex w-full items-center gap-1.5 sm:w-auto"
                          >
                            <button
                              onClick={() => removeMeta(day.id, m.id)}
                              className="absolute -left-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-xs group-hover/m:flex no-print [@media(hover:none)]:flex"
                            >
                              ×
                            </button>
                            <ItineraryIcon
                              icon={m.label.trim().toLowerCase()}
                              className="h-3.5 w-3.5 shrink-0 text-[#145C3E] dark:text-primary"
                            />
                            <input
                              value={m.label}
                              onChange={(e) => updateMeta(day.id, m.id, "label", e.target.value)}
                              aria-label="Detail"
                              className={`${inlineInputCls} w-20 shrink-0 text-[11px] text-[#6B7C73] dark:text-muted-foreground`}
                            />
                            <input
                              value={m.value}
                              onChange={(e) => updateMeta(day.id, m.id, "value", e.target.value)}
                              aria-label={m.label}
                              className={`${inlineInputCls} min-w-0 flex-1 text-xs text-[#0F2A1E] dark:text-foreground sm:w-40 sm:flex-none`}
                            />
                          </div>
                        ))}
                      <button
                        onClick={() => addMeta(day.id)}
                        className="addbtn inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#145C3E]/40 px-2.5 py-1 text-[12px] font-bold text-[#145C3E] transition hover:bg-[#E8F2EB] dark:border-primary/40 dark:text-primary dark:hover:bg-primary/10 no-print"
                      >
                        <Plus className="h-3 w-3" /> detail
                      </button>
                    </div>
                  </div>

                  {/* Photo inset inside the card with its own rounded corners, like the proposal. */}
                  <div className="flex shrink-0 p-4 pt-0 sm:w-[150px] sm:pl-0 sm:pt-4 md:w-[30%]">
                    <div className="relative min-h-[200px] flex-1 overflow-hidden rounded-lg sm:min-h-[160px]">
                    <ImagePicker
                      value={day.image}
                      onChange={(src) => updateDay(day.id, { image: src })}
                      className="absolute right-2 top-2 z-10"
                      label="Replace"
                    />
                    {/* `absolute inset-0` (not a percentage height on an
                        in-flow child) is what actually makes this match the
                        content column's height exactly — a plain height:100%
                        img is spec'd to resolve as "auto" against a
                        stretched-but-not-explicitly-sized flex item in most
                        browsers, which is what was making this taller than
                        the content. Absolute positioning resolves against
                        the parent's final computed box instead, which is
                        unambiguous. The overflow-hidden + rounded corners
                        live on THIS wrapper (not the outer card) so they
                        don't clip the day's floating remove button, which
                        deliberately sits outside the card's edge. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={day.image}
                      alt={day.title}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                    </div>
                  </div>
                  </div>
                  {/* Library actions — full width under content + photo, same as the proposal. */}
                    {(dayPlans.canPick || dayPlans.canSave) && (
                      <div className="flex items-center justify-between gap-2 border-t border-[#EDF3EF] px-4 py-3 no-print dark:border-mute/20">
                        {dayPlans.canPick ? (
                          <button
                            type="button"
                            onClick={() => setPickForDay(day.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#145C3E] px-2.5 py-1 text-[12px] font-bold text-white hover:brightness-110 dark:bg-primary dark:text-primary-foreground"
                          >
                            <Sparkles className="h-3 w-3" /> Pick from library
                          </button>
                        ) : (
                          <span />
                        )}
                        {dayPlans.canSave && (
                          <button
                            type="button"
                            onClick={() => setSaveDay(day)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#145C3E]/30 px-2.5 py-1 text-[12px] font-bold text-[#145C3E] hover:bg-[#E8F2EB] dark:border-primary/30 dark:text-primary dark:hover:bg-primary/10"
                          >
                            <BookmarkPlus className="h-3 w-3" /> Save to library
                          </button>
                        )}
                      </div>
                    )}
                </div>
              )}
            </ReorderableList>
            {pickForDay && (
              <DayPlanPicker
                open
                onOpenChange={(o) => !o && setPickForDay(null)}
                dayNumber={data.days.findIndex((d) => d.id === pickForDay) + 1}
                onPick={(plan) => updateDay(pickForDay, { title: plan.title, body: plan.body })}
              />
            )}
            {saveDay && (
              <DayPlanFormDialog
                open
                onOpenChange={(o) => !o && setSaveDay(null)}
                title="Save this day to the library"
                initial={{ ...EMPTY_DAY_PLAN, ...guessRoute(saveDay.title), title: saveDay.title, body: saveDay.body }}
                onSaved={() => {}}
              />
            )}

            <button
              onClick={addDay}
              className="addbtn mt-7 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[hsl(156_40%_21%)]/40 px-4 py-2 text-sm font-bold text-[hsl(156_40%_21%)] transition hover:bg-[hsl(150_28%_92%)]/60 dark:border-primary/40 dark:text-primary dark:hover:bg-primary/10 no-print"
            >
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

            <ReorderableList
              items={data.hotels}
              onReorder={reorderHotels}
              noun="hotel"
              className="mt-6 space-y-5"
            >
              {(h, idx) => (
                <div
                  className="group/hotel relative flex flex-col rounded-xl border border-[hsl(40_14%_87%)] dark:border-mute/20 sm:flex-row sm:items-stretch"
                >
                  <button
                    onClick={() => removeHotel(h.id)}
                    aria-label={`Remove hotel row ${idx + 1}`}
                    className="absolute -left-2 -top-2 z-20 hidden h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white opacity-0 transition-opacity group-hover/hotel:flex group-hover/hotel:opacity-100 no-print [@media(hover:none)]:flex [@media(hover:none)]:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>

                  {/* Content — 60% */}
                  <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:w-[60%] sm:flex-none">
                    <div>
                      <label className={fieldLabel}>Hotel Name</label>
                      <input
                        value={h.hotelDetails}
                        onChange={(e) => updateHotel(h.id, "hotelDetails", e.target.value)}
                        placeholder="Hotel name"
                        className={`${numberInputCls} font-semibold`}
                      />
                      <input
                        value={h.hotelAlt}
                        onChange={(e) => updateHotel(h.id, "hotelAlt", e.target.value)}
                        placeholder="or similar category"
                        className={`${numberInputCls} mt-1.5 text-xs text-mute dark:text-muted-foreground`}
                      />
                    </div>
                    <div>
                      <label className={fieldLabel}>Location</label>
                      <input
                        value={h.destination}
                        onChange={(e) => updateHotel(h.id, "destination", e.target.value)}
                        placeholder="Pahalgam (1N)"
                        className={numberInputCls}
                      />
                    </div>

                    {/* Check In / Check Out / Nights / No. of Rooms / Extra Bed + Child Without Bed, then
                        Room Type and Meal Type on full-width rows (free text, wraps when halved). */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[hsl(40_14%_87%)] pt-3 dark:border-mute/20">
                      {/* Filled from the travel dates + nights (resyncTripDates); still adjustable. */}
                      <div>
                        <label className={fieldLabel}>Check In</label>
                        <input
                          type="date"
                          value={stayDateInputValue(h.checkIn)}
                          onChange={(e) => updateHotel(h.id, "checkIn", e.target.value)}
                          className={numberInputCls}
                        />
                      </div>
                      <div>
                        <label className={fieldLabel}>Check Out</label>
                        <input
                          type="date"
                          min={stayDateInputValue(h.checkIn) || undefined}
                          value={stayDateInputValue(h.checkOut)}
                          onChange={(e) => updateHotel(h.id, "checkOut", e.target.value)}
                          className={numberInputCls}
                        />
                      </div>
                      <div className="min-w-0">
                        <label className={fieldLabel}>Nights</label>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={h.nights}
                          onChange={(e) => updateHotel(h.id, "nights", e.target.value)}
                          onBlur={(e) => {
                            const n = parseInt(e.target.value, 10);
                            if (!e.target.value.trim() || Number.isNaN(n) || n < 1) {
                              updateHotel(h.id, "nights", "1");
                            }
                          }}
                          className={numberInputCls}
                        />
                      </div>
                      <div className="min-w-0">
                        <label className={fieldLabel}>No. of Rooms</label>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={h.rooms}
                          onChange={(e) => updateHotel(h.id, "rooms", e.target.value)}
                          onBlur={(e) => {
                            const n = parseInt(e.target.value, 10);
                            if (!e.target.value.trim() || Number.isNaN(n) || n < 1) {
                              updateHotel(h.id, "rooms", "1");
                            }
                          }}
                          className={numberInputCls}
                        />
                      </div>
                      {/* Bed counts — one row (a child with bed counts as an Extra Bed). */}
                      <div className="col-span-2 grid grid-cols-2 gap-x-4">
                        <div className="min-w-0">
                          <label className={fieldLabel}>Extra Bed</label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={h.extraBed}
                            onChange={(e) => updateHotel(h.id, "extraBed", e.target.value)}
                            onBlur={(e) => {
                              const n = parseInt(e.target.value, 10);
                              if (!e.target.value.trim() || Number.isNaN(n) || n < 0) {
                                updateHotel(h.id, "extraBed", "0");
                              }
                            }}
                            className={numberInputCls}
                          />
                        </div>
                        <div className="min-w-0">
                          <label className={fieldLabel}>Child Without Bed</label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={h.childWithoutBed}
                            onChange={(e) => updateHotel(h.id, "childWithoutBed", e.target.value)}
                            onBlur={(e) => {
                              const n = parseInt(e.target.value, 10);
                              if (!e.target.value.trim() || Number.isNaN(n) || n < 0) {
                                updateHotel(h.id, "childWithoutBed", "0");
                              }
                            }}
                            className={numberInputCls}
                          />
                        </div>
                      </div>
                      <div className="col-span-2 min-w-0">
                        <label className={fieldLabel}>Room Type</label>
                        <input
                          value={h.roomType}
                          onChange={(e) => updateHotel(h.id, "roomType", e.target.value)}
                          placeholder="Double Sharing"
                          className={numberInputCls}
                        />
                      </div>
                      <div className="col-span-2 min-w-0">
                        <label className={fieldLabel}>Meal Type</label>
                        {/* A sentence — stays a wrapping box, bordered to match. */}
                        <EditableField
                          value={h.mealType}
                          onValueChange={(v) => updateHotel(h.id, "mealType", v)}
                          className="border border-[hsl(40_14%_87%)]/80 px-2 py-1 text-sm dark:border-white/10 print:border-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Image — 40%. `absolute inset-0` (not a percentage
                      height on an in-flow child) is what actually matches
                      this to the content column's height — same reasoning
                      as the day card's image above. overflow-hidden +
                      rounded corners live on this wrapper, not the outer
                      card, so they don't clip the floating remove button. */}
                  <div className="relative h-[200px] shrink-0 overflow-hidden rounded-b-xl sm:h-auto sm:w-[40%] sm:rounded-bl-none sm:rounded-r-xl">
                    <ImagePicker
                      value={h.image}
                      onChange={(src) => updateHotel(h.id, "image", src)}
                      className="absolute right-2 top-2 z-10"
                      label="Replace"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={h.image}
                      alt={h.hotelDetails}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
            </ReorderableList>

            <button onClick={addHotel} className={addBtn}>
              <Plus className="h-3 w-3" /> Add Hotel
            </button>
            <p className="mt-3 text-[12px] italic text-mute dark:text-muted-foreground">
              *All accommodations are subject to availability at the time of confirmation.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-y-6 rounded-2xl bg-[hsl(40_33%_96%)] px-3 py-6 dark:bg-muted/20 sm:grid-cols-4 sm:px-7">
              {data.trust.map((t, i) => (
                <div
                  key={t.id}
                  className={`flex flex-col items-center px-2 text-center sm:px-3 ${i ? "sm:border-l sm:border-[hsl(40_14%_87%)] dark:sm:border-mute/20" : ""}`}
                >
                  <ItineraryIcon
                    icon={t.icon}
                    className="h-6 w-6 text-[hsl(156_40%_21%)] dark:text-primary"
                  />
                  <EditableField
                    value={t.title}
                    onValueChange={(v) => updateTrust(t.id, "title", v)}
                    className="mt-2 text-center text-xs font-bold"
                  />
                  <EditableField
                    value={t.subtitle}
                    onValueChange={(v) => updateTrust(t.id, "subtitle", v)}
                    className="text-center text-[12px] leading-snug text-mute dark:text-muted-foreground"
                  />
                </div>
              ))}
            </div>

            {/* Included Activities — free add/remove list (unlike Trust
               above, which is a fixed 4). Renders right after the Trust
               strip in the PDF too (before Transportation Info) — omitted
               there entirely once this list is empty, but "Add Activity"
               stays available regardless. */}
            <div className="mt-8">
              <div className="flex items-center gap-4">
                <h3 className="font-serif text-xl font-bold text-[hsl(156_40%_21%)] dark:text-primary">
                  Included Activities
                </h3>
                <span className="h-px flex-1 bg-[hsl(40_14%_87%)] dark:bg-mute/20" />
              </div>
              <div className="mt-4 space-y-3">
                {data.activities.map((a, idx) => (
                  // Same card as a transport vehicle: phones = photo on top,
                  // labelled inputs below; sm+ = inputs left, photo right.
                  <div
                    key={a.id}
                    className="relative flex flex-col overflow-hidden rounded-xl border border-[hsl(40_14%_87%)] dark:border-mute/20 sm:flex-row-reverse"
                  >
                    <div className="relative h-[170px] shrink-0 sm:h-auto sm:w-[40%]">
                      <ImagePicker
                        value={a.image}
                        onChange={(src) => updateActivity(a.id, "image", src)}
                        className="absolute bottom-2 right-2 z-10"
                        label="Replace"
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.image || "/itinerary/hero.webp"}
                        alt={a.name}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="grid min-w-0 flex-1 grid-cols-2 content-start gap-x-3 gap-y-2 p-3">
                      <div className="col-span-2">
                        <label className={fieldLabel}>Activity</label>
                        <input
                          value={a.name}
                          onChange={(e) => updateActivity(a.id, "name", e.target.value)}
                          placeholder="Shikara Ride"
                          className={`${numberInputCls} font-bold`}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className={fieldLabel}>Place</label>
                        <input
                          value={a.place}
                          onChange={(e) => updateActivity(a.id, "place", e.target.value)}
                          placeholder="Dal Lake, Srinagar"
                          className={numberInputCls}
                        />
                      </div>
                      <div className="">
                        <label className={fieldLabel}>Time</label>
                        <input
                          value={a.time}
                          onChange={(e) => updateActivity(a.id, "time", e.target.value)}
                          placeholder="1 Hour"
                          className={numberInputCls}
                        />
                      </div>
                      <div className="">
                        <label className={fieldLabel}>Day</label>
                        <input
                          value={a.day}
                          onChange={(e) => updateActivity(a.id, "day", e.target.value)}
                          placeholder="Day 05"
                          className={numberInputCls}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeActivity(a.id)}
                      aria-label={`Remove activity ${idx + 1}`}
                      className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow hover:text-rose-600 dark:bg-card no-print"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addActivity} className={`${addBtn} mt-3`}>
                <Plus className="h-3 w-3" /> Add Activity
              </button>
            </div>

            {/* "Available on the day" — paid-locally activities, not part of
                the package. Same add/remove-to-zero shape as Included
                Activities above, minus the photo. */}
            <PriceActivitySection
              title="Available on the Day"
              items={data.optionalActivities}
              onUpdate={(id, field, v) => updatePriceActivity("optionalActivities", id, field, v)}
              onRemove={(id) => removePriceActivity("optionalActivities", id)}
              onAdd={() => addPriceActivity("optionalActivities")}
              addLabel="Add Activity"
            />

            <Footer />
          </article>

          {/* Transport + Inclusions/Exclusions */}
          <article className={pageCard}>
            <div className="flex items-center gap-4">
              <h2 className={greenHead}>Transportation Info</h2>
              <span className="h-px flex-1 bg-[hsl(40_14%_87%)] dark:bg-mute/20" />
            </div>
            {/* One full card per vehicle (fields + its own photo), same as the
                proposal's Transportation rows: same cab twice → No. = 2; a
                different cab (Innova + Swift) → "Add vehicle". Tags are
                shared by all vehicles, kept separate below. */}
            <div className="mt-6 space-y-3">
              <div className="rounded-xl border border-[hsl(40_14%_87%)] dark:border-mute/20 relative flex flex-col overflow-hidden sm:flex-row">
                <div className="grid min-w-0 flex-1 grid-cols-4 content-start gap-x-3 gap-y-2 p-3">
                    <div className="col-span-3">
                      <label className={fieldLabel}>Vehicle</label>
                      <input
                        value={data.transportType}
                        onChange={(e) => updateCover("transportType", e.target.value)}
                        placeholder="Private Sedan"
                        className={`${numberInputCls} font-bold`}
                      />
                    </div>
                    <div>
                      <label className={fieldLabel}>No.</label>
                      <input
                        value={data.transportCount}
                        onChange={(e) => updateCover("transportCount", e.target.value.replace(/\D/g, "").slice(0, 2))}
                        inputMode="numeric"
                        placeholder="1"
                        className={numberInputCls}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={fieldLabel}>Seating</label>
                      <input
                        value={data.transportSeats}
                        onChange={(e) => updateCover("transportSeats", e.target.value)}
                        placeholder="4 seats"
                        className={numberInputCls}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={fieldLabel}>Duration</label>
                      <input
                        value={data.transportDays}
                        onChange={(e) => updateCover("transportDays", e.target.value)}
                        placeholder="Day 01 – 06"
                        className={numberInputCls}
                      />
                    </div>
                    <div className="col-span-4">
                      <label className={fieldLabel}>Used For</label>
                      <EditableField
                        value={data.transportDesc}
                        onValueChange={(val) => updateCover("transportDesc", val)}
                        placeholder="e.g. Airport pick-up & sightseeing"
                        className="border border-[hsl(40_14%_87%)]/80 px-2 py-1 text-sm dark:border-white/10 print:border-none"
                      />
                    </div>
                </div>
                <div className="relative h-[170px] shrink-0 sm:h-auto sm:w-[40%]">
                  <ImagePicker
                    value={data.transportImage}
                    onChange={(src) => updateCover("transportImage", src)}
                    className="absolute bottom-2 right-2 z-10"
                    label="Replace"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.transportImage || "/itinerary/gurez.webp"}
                    alt="Vehicle"
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              {data.extraVehicles.map((v) => (
                <div key={v.id} className="rounded-xl border border-[hsl(40_14%_87%)] dark:border-mute/20 relative flex flex-col overflow-hidden sm:flex-row">
                <div className="grid min-w-0 flex-1 grid-cols-4 content-start gap-x-3 gap-y-2 p-3">
                    <div className="col-span-3">
                      <label className={fieldLabel}>Vehicle</label>
                      <input
                        value={v.type}
                        onChange={(e) => updateExtraVehicle(v.id, { type: e.target.value })}
                        placeholder="SUV"
                        className={`${numberInputCls} font-bold`}
                      />
                    </div>
                    <div>
                      <label className={fieldLabel}>No.</label>
                      <input
                        value={v.count}
                        onChange={(e) => updateExtraVehicle(v.id, { count: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                        inputMode="numeric"
                        placeholder="1"
                        className={numberInputCls}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={fieldLabel}>Seating</label>
                      <input
                        value={v.seats}
                        onChange={(e) => updateExtraVehicle(v.id, { seats: e.target.value })}
                        placeholder="6 seats"
                        className={numberInputCls}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={fieldLabel}>Duration</label>
                      <input
                        value={v.days}
                        onChange={(e) => updateExtraVehicle(v.id, { days: e.target.value })}
                        placeholder="Day 03 – 05"
                        className={numberInputCls}
                      />
                    </div>
                    <div className="col-span-4">
                      <label className={fieldLabel}>Used For</label>
                      <EditableField
                        value={v.usedFor}
                        onValueChange={(val) => updateExtraVehicle(v.id, { usedFor: val })}
                        placeholder="e.g. Airport pick-up & sightseeing"
                        className="border border-[hsl(40_14%_87%)]/80 px-2 py-1 text-sm dark:border-white/10 print:border-none"
                      />
                    </div>
                </div>
                <div className="relative h-[170px] shrink-0 sm:h-auto sm:w-[40%]">
                  <ImagePicker
                    value={v.image}
                    onChange={(src) => updateExtraVehicle(v.id, { image: src })}
                    className="absolute bottom-2 right-2 z-10"
                    label="Replace"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.image || "/itinerary/gurez.webp"}
                    alt="Vehicle"
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <button
                  onClick={() =>
                    setData((p) => ({
                      ...p,
                      extraVehicles: p.extraVehicles.filter((x) => x.id !== v.id),
                    }))
                  }
                  aria-label={`Remove vehicle ${v.type}`}
                  className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow hover:text-rose-600 dark:bg-card no-print"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setData((p) => ({
                    ...p,
                    extraVehicles: [
                      ...p.extraVehicles,
                      {
                        id: genId("veh"),
                        type: "",
                        count: "1",
                        seats: "",
                        days: "",
                        usedFor: "",
                        image: "",
                      },
                    ],
                  }))
                }
                className={`${addBtn} !mt-3`}
              >
                <Plus className="h-3 w-3" /> Add vehicle
              </button>
                <div>
                  <label className={fieldLabel}>Tags (all vehicles)</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {data.transportTags.map((tag, idx) => (
                      <ChipInput
                        key={idx}
                        value={tag}
                        onChange={(v) =>
                          setData((p) => ({
                            ...p,
                            transportTags: p.transportTags.map((t, i) => (i === idx ? v : t)),
                          }))
                        }
                        onRemove={() =>
                          setData((p) => ({
                            ...p,
                            transportTags: p.transportTags.filter((_, i) => i !== idx),
                          }))
                        }
                        label={`Tag ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      setData((p) => ({ ...p, transportTags: [...p.transportTags, "New tag"] }))
                    }
                    className={addBtn}
                  >
                    <Plus className="h-2.5 w-2.5" /> tag
                  </button>
                </div>
            </div>

            {/* Inclusions/Exclusions — separate full-width row sections
                rather than side-by-side columns, so each reads as its own
                section like every other block on the page. */}
            <div className="mt-11 space-y-10">
              <ListColumn
                title="Package Inclusions"
                items={data.inc}
                tone="inc"
                onUpdateCategory={(id, v) => updateListItemRow("inc", id, "category", v)}
                onUpdateText={(id, v) => updateListItemRow("inc", id, "text", v)}
                onRemove={(id) => removeListItemRow("inc", id)}
                onAdd={() => addListItemRow("inc")}
                addLabel="Add inclusion"
              />
              <ListColumn
                title="Package Exclusions"
                items={data.exc}
                tone="exc"
                onUpdateCategory={(id, v) => updateListItemRow("exc", id, "category", v)}
                onUpdateText={(id, v) => updateListItemRow("exc", id, "text", v)}
                onRemove={(id) => removeListItemRow("exc", id)}
                onAdd={() => addListItemRow("exc")}
                addLabel="Add exclusion"
              />
              <ListColumn
                title="Travel Check List"
                items={data.checklist}
                tone="check"
                onUpdateCategory={(id, v) => updateListItemRow("checklist", id, "category", v)}
                onUpdateText={(id, v) => updateListItemRow("checklist", id, "text", v)}
                onRemove={(id) => removeListItemRow("checklist", id)}
                onAdd={() => addListItemRow("checklist")}
                addLabel="Add check list item"
              />
            </div>

            <Footer />
          </article>

          {/* Payment & Cancellation — Payment card full width (3 columns
              inside: step 1 | step 2 | tags+note, divided by vertical
              rules), then the Cancellation card full width below it — same
              stacked shape as the PDF, not two side-by-side cards. */}
          <article className={pageCard}>
            <h2 className="font-serif text-3xl font-bold text-[hsl(156_40%_21%)] dark:text-primary">
              Payment &amp; Cancellation
            </h2>

            <div className="mt-8 rounded-2xl border border-[hsl(40_14%_87%)] bg-white p-6 shadow-soft dark:border-mute/20 dark:bg-card">
              <h3 className="text-base font-bold">How payment works</h3>
              <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-stretch">
                <div className="sm:min-w-0 sm:flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#145C3E] text-[10px] font-bold text-white">
                      1
                    </span>
                    <EditableField
                      value={data.payStep1Title}
                      onValueChange={(v) => updateCover("payStep1Title", v)}
                      className="min-w-0 flex-1 text-sm font-bold"
                    />
                  </div>
                  <EditableField
                    value={data.payStep1Desc}
                    onValueChange={(v) => updateCover("payStep1Desc", v)}
                    className="ml-7 mt-1 text-xs text-mute dark:text-muted-foreground"
                  />
                </div>

                <div className="hidden w-px shrink-0 bg-[hsl(40_14%_87%)] dark:bg-mute/20 sm:block" />

                <div className="sm:min-w-0 sm:flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#B8D4C4] text-[10px] font-bold text-[#0F3A28]">
                      2
                    </span>
                    <EditableField
                      value={data.payStep2Title}
                      onValueChange={(v) => updateCover("payStep2Title", v)}
                      className="min-w-0 flex-1 text-sm font-bold"
                    />
                  </div>
                  <EditableField
                    value={data.payStep2Desc}
                    onValueChange={(v) => updateCover("payStep2Desc", v)}
                    className="ml-7 mt-1 text-xs text-mute dark:text-muted-foreground"
                  />
                </div>

                <div className="hidden w-px shrink-0 bg-[hsl(40_14%_87%)] dark:bg-mute/20 sm:block" />

                <div className="sm:min-w-0 sm:flex-1">
                  <label className={fieldLabel}>Payment methods</label>
                  <div className="grid gap-2">
                    {data.pay.map((tag, idx) => (
                      <ChipInput
                        key={idx}
                        value={tag}
                        onChange={(v) => updateListItem("pay", idx, v)}
                        onRemove={() => removeListItem("pay", idx)}
                        label={`Payment method ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <button onClick={() => addListItem("pay", "New tag")} className={addBtn}>
                    <Plus className="h-2.5 w-2.5" /> tag
                  </button>
                  <EditableField
                    value={data.payNote}
                    onValueChange={(v) => updateCover("payNote", v)}
                    className="mt-2 text-[11px] italic text-mute dark:text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <CancelTierCard
                items={data.cancel}
                onUpdate={updateCancelTier}
                onRemove={removeCancelTier}
                onAdd={addCancelTier}
              />
              {/* Cancellation footnotes — small add/remove text list, same
                  pattern as the pay tags above. */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {data.cancelNotes.map((note, idx) => (
                  <span key={idx} className="group/note relative">
                    <EditableField
                      value={note}
                      onValueChange={(v) =>
                        setData((p) => ({
                          ...p,
                          cancelNotes: p.cancelNotes.map((n, i) => (i === idx ? v : n)),
                        }))
                      }
                      className="rounded-full border border-[hsl(40_14%_87%)] px-3 py-1 text-[11px] text-mute dark:border-mute/20 dark:text-muted-foreground"
                    />
                    <button
                      onClick={() =>
                        setData((p) => ({
                          ...p,
                          cancelNotes: p.cancelNotes.filter((_, i) => i !== idx),
                        }))
                      }
                      aria-label={`Remove note ${note}`}
                      className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] text-white group-hover/note:flex no-print [@media(hover:none)]:flex"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  onClick={() =>
                    setData((p) => ({ ...p, cancelNotes: [...p.cancelNotes, "New note"] }))
                  }
                  className="addbtn inline-flex items-center gap-1 rounded-full border border-dashed border-[hsl(156_40%_21%)]/40 px-2.5 py-1 text-[11px] font-bold text-[hsl(156_40%_21%)] dark:border-primary/40 dark:text-primary no-print"
                >
                  <Plus className="h-2.5 w-2.5" /> note
                </button>
              </div>
            </div>
            <Footer />
          </article>

          {/* Why Choose Vertex — editable like Trust above (title/subtitle
             per item); icon is fixed per item (assigned when seeded from
             real WhyChooseItem data), same as Trust's icons aren't
             user-pickable either. Intro line is fixed approved copy, matching
             ItineraryPdf.tsx (not per-itinerary editable). */}
          <article className={pageCard}>
            <h2 className="font-serif text-3xl font-bold text-[hsl(156_40%_21%)] dark:text-primary">
              Why Choose Vertex
            </h2>
            <p className="mt-3 text-sm italic text-mute dark:text-muted-foreground">
              From carefully planned itineraries to reliable local support, we handle the details so
              you can enjoy Kashmir with confidence.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {data.whyChoose.map((w) => (
                <div
                  key={w.id}
                  className="flex gap-3 rounded-xl border border-[hsl(40_14%_87%)] p-4 dark:border-mute/20"
                >
                  <ItineraryIcon
                    icon={w.icon}
                    className="h-6 w-6 shrink-0 text-[hsl(156_40%_21%)] dark:text-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <EditableField
                      value={w.title}
                      onValueChange={(v) => updateWhyChoose(w.id, "title", v)}
                      className="text-sm font-bold"
                    />
                    <EditableField
                      value={w.subtitle}
                      onValueChange={(v) => updateWhyChoose(w.id, "subtitle", v)}
                      className="mt-1 text-[12px] leading-snug text-mute dark:text-muted-foreground"
                    />
                  </div>
                </div>
              ))}
            </div>
            <Footer />
          </article>

          {/* Thank you */}
          <article className="page overflow-hidden rounded-xl border border-[hsl(40_14%_87%)] bg-white shadow-page dark:border-mute/20 dark:bg-card">
            {/* Payment Options — renders above the Thank You block on the PDF's
               closing page (see ItineraryPdf.tsx). This panel depicts the
               PDF's own fixed dark-green brand page — not the admin app's
               light/dark theme — so its background is a literal color, not
               dark:bg-primary (which resolves to gold in this app's dark
               theme and made the panel look like a mismatched grey/tan
               block instead of matching the Thank You panel below it). */}
            <div className="bg-[hsl(158_46%_14%)] p-6 sm:p-8">
              <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[hsl(146_35%_55%)]">
                Payment Options
              </p>
              <div className="mx-auto mt-2 h-[1.5px] w-10 bg-[hsl(146_35%_55%)]" />
              <div className="mt-6 grid items-center gap-6 sm:grid-cols-[1.2fr_1fr]">
                <div className="flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/gateway/payment-partner-dark.webp"
                    alt="Payment partners"
                    className="h-24 w-auto max-w-full object-contain"
                  />
                </div>
                <div className="flex flex-col items-center">
                  {/* No image picker here anymore — the QR is a live,
                     itinerary-specific Razorpay Payment Link (10% token
                     amount, never a staff-uploaded image), generated fresh
                     each time the PDF is exported. See
                     src/lib/itinerary/tokenPaymentLink.ts. */}
                  <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-white p-2 shadow-soft">
                    <QrCode className="h-14 w-14 text-[hsl(158_46%_14%)]/40" />
                  </div>
                  <p className="mt-2 max-w-[160px] text-center text-[11px] text-white/60">
                    Payment QR is generated when you export the PDF
                  </p>
                </div>
              </div>
              {/* Same divider treatment as the PDF's tyDivider (mint, thin,
                 centered) — separates this section from the Thank You block
                 below instead of a background-color seam. */}
              <div className="mx-auto mt-8 h-[2px] w-16 bg-[hsl(146_35%_55%)]" />
            </div>

            <div className="grid sm:grid-cols-[1.6fr_1fr]">
              <div className="p-6 sm:p-10">
                <div className="flex items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/png/horizontal/vertex-horizontal-light-1600w.png"
                    alt="Vertex Kashmir Holidays"
                    className="h-12 w-auto object-contain dark:hidden"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/png/horizontal/vertex-horizontal-dark-1600w.png"
                    alt="Vertex Kashmir Holidays"
                    className="hidden h-12 w-auto object-contain dark:block"
                  />
                </div>
                <p className="font-serif mt-4 text-xl font-bold text-[hsl(156_40%_21%)] dark:text-primary">
                  {PDF_CONTACT.company}
                </p>
                <p className="text-sm text-mute dark:text-muted-foreground">{PDF_CONTACT.reg}</p>
                <div className="mt-7 space-y-3 text-sm">
                  <p className="flex items-center gap-3">
                    <ItineraryIcon
                      icon="support"
                      className="h-5 w-5 text-[hsl(156_40%_21%)] dark:text-primary"
                    />
                    <span className="font-semibold">{PDF_CONTACT.phone}</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <ItineraryIcon
                      icon="map-pin"
                      className="h-5 w-5 text-[hsl(156_40%_21%)] dark:text-primary"
                    />
                    <span className="font-semibold">{companyAddress ?? PDF_CONTACT.address}</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <ItineraryIcon
                      icon="calendar"
                      className="h-5 w-5 text-[hsl(156_40%_21%)] dark:text-primary"
                    />
                    <span className="font-semibold">{PDF_CONTACT.email}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center bg-[hsl(158_46%_14%)] p-8 text-center text-white sm:p-10">
                <p className="font-script text-4xl leading-none text-[hsl(146_35%_55%)] sm:text-5xl">
                  Thank You!
                </p>
                <p className="mt-4 max-w-[220px] text-sm leading-relaxed text-white/85">
                  We look forward to hosting you in the paradise on earth.
                </p>
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
    <div className="print-foot mt-10 border-t border-[hsl(40_14%_87%)] pt-3 text-center text-[10px] tracking-wide text-mute dark:border-mute/20">
      Vertex Kashmir Holidays · Kashmir Escape Itinerary
    </div>
  );
}

function ListColumn({
  title,
  items,
  tone,
  onUpdateCategory,
  onUpdateText,
  onRemove,
  onAdd,
  addLabel,
}: {
  title: string;
  items: ListItem[];
  tone: "inc" | "exc" | "check";
  onUpdateCategory: (id: string, v: string) => void;
  onUpdateText: (id: string, v: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div>
      <h3 className="font-serif text-[22px] font-bold text-[hsl(156_40%_21%)] dark:text-primary">
        {title}
      </h3>
      <ul className="mt-5 space-y-3 text-sm text-ink/85 dark:text-muted-foreground">
        {items.map((item) => (
          <li key={item.id} className="listrow group relative flex items-start gap-2.5 pr-7">
            <span
              className={`mt-1.5 flex h-[17px] w-[17px] shrink-0 items-center justify-center text-white ${tone === "check" ? "rounded bg-[hsl(38_70%_45%)]" : tone === "inc" ? "rounded-full bg-[hsl(156_40%_21%)] dark:bg-primary" : "rounded-full bg-rose-500"}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-2.5 w-2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {tone === "exc" ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M20 6 9 17l-5-5" />}
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              {/* Category is a small, rarely-touched tag (not a prominent
                  blank-looking field) — most rows already come with one
                  filled in from the default content, staff mainly just edit
                  the text below it. */}
              <input
                value={item.category}
                onChange={(e) => onUpdateCategory(item.id, e.target.value)}
                placeholder="Category"
                aria-label="Category"
                className="w-full max-w-[220px] rounded-md border border-[hsl(40_14%_87%)]/80 bg-transparent px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-[#145C3E] outline-none focus:ring-1 focus:ring-primary/30 dark:border-white/10 dark:text-primary max-md:text-[16px] print:border-none"
              />
              {/* Can be a full sentence — a bordered box that wraps. */}
              <EditableField
                value={item.text}
                onValueChange={(v) => onUpdateText(item.id, v)}
                aria-label="Item"
                className="mt-1.5 border border-[hsl(40_14%_87%)]/80 px-2 py-1.5 text-sm dark:border-white/10 print:border-none"
              />
            </div>
            <button
              onClick={() => onRemove(item.id)}
              aria-label={`Remove item from ${title}`}
              className="absolute right-0 top-1 text-rose-500 hover:text-rose-600 no-print"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={onAdd}
        className="addbtn mt-4 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[hsl(156_40%_21%)]/40 px-3 py-1.5 text-xs font-bold text-[hsl(156_40%_21%)] transition hover:bg-[hsl(150_28%_92%)]/60 dark:border-primary/40 dark:text-primary dark:hover:bg-primary/10 no-print"
      >
        <Plus className="h-3 w-3" /> {addLabel}
      </button>
    </div>
  );
}

function CancelTierCard({
  items,
  onUpdate,
  onRemove,
  onAdd,
}: {
  items: CancelTier[];
  onUpdate: (id: string, field: "label" | "charge", v: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="policy-card rounded-2xl border border-[hsl(40_14%_87%)] bg-white p-6 shadow-soft dark:border-mute/20 dark:bg-card">
      <h3 className="text-base font-bold">If you need to cancel</h3>
      <p className="mt-1 text-xs text-mute dark:text-muted-foreground">
        Notice is counted from your first travel date. Cancellations must be requested by email.
      </p>
      <div className="mt-4 flex items-center justify-between border-b border-[hsl(40_14%_87%)] pb-2 text-[10px] font-semibold uppercase tracking-wide text-mute dark:border-mute/20 dark:text-muted-foreground">
        <span>Notice before travel</span>
        <span>Charge</span>
      </div>
      <ul className="text-sm leading-relaxed text-ink/80 dark:text-muted-foreground">
        {items.map((item) => {
          const pct = parseFloat(item.charge);
          const high = !Number.isNaN(pct) && pct >= 50;
          return (
            <li
              key={item.id}
              className="group relative flex items-center gap-3 border-b border-[hsl(40_14%_87%)]/60 py-2.5 pr-6 last:border-0 dark:border-mute/10"
            >
              <EditableField
                value={item.label}
                onValueChange={(v) => onUpdate(item.id, "label", v)}
                placeholder="Notice given before travel"
                className="flex-1 text-xs"
              />
              <EditableField
                value={item.charge}
                onValueChange={(v) => onUpdate(item.id, "charge", v)}
                placeholder="Charge"
                className={`w-16 shrink-0 text-right text-sm font-bold ${high ? "text-[#8A5340]" : "text-[#145C3E]"}`}
              />
              <button
                onClick={() => onRemove(item.id)}
                aria-label="Remove cancellation tier"
                className="absolute right-0 top-0 hidden text-rose-500 group-hover:block no-print [@media(hover:none)]:block"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          );
        })}
      </ul>
      <button
        onClick={onAdd}
        className="addbtn mt-4 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[hsl(156_40%_21%)]/40 px-3 py-1.5 text-xs font-bold text-[hsl(156_40%_21%)] transition hover:bg-[hsl(150_28%_92%)]/60 dark:border-primary/40 dark:text-primary dark:hover:bg-primary/10 no-print"
      >
        <Plus className="h-3 w-3" /> Add tier
      </button>
    </div>
  );
}
