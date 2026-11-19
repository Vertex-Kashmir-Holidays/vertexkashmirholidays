"use client";

import { useCallback, useState } from "react";
import { resyncDayDates } from "@/lib/itinerary/travelDates";
import { stayDateInputValue } from "@/lib/itinerary/stayDate";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Plus, Sparkles, BookmarkPlus } from "lucide-react";
import { DayPlanPicker } from "../day-plans/DayPlanPicker";
import { DayPlanFormDialog, EMPTY_DAY_PLAN } from "../day-plans/DayPlanFormDialog";
import { guessRoute, toProposalDay, type DayPlanRecord } from "@/lib/dayPlans/schema";
import { Toolbar } from "./Toolbar";
import { ProposalAssignee, type AssigneeOption } from "./ProposalAssignee";
import { ConvertToItineraryDialog } from "./ConvertToItineraryDialog";
import { ReorderableList } from "../itinerary/ReorderableList";
import { EditableField } from "../itinerary/EditableField";
import { ChipInput } from "../itinerary/ChipInput";
import { ImagePicker } from "../itinerary/ImagePicker";
import { PriceActivitySection } from "../itinerary/PriceActivitySection";
import { ItineraryIcon } from "../itinerary/icons";
import { DEFAULT_PROPOSAL_DATA, DEFAULT_SINGLE_PROPOSAL_DATA } from "./default-data";
import { downloadProposalPdf } from "@/lib/proposal/export-pdf";
import { buildDocumentTitle, isCopyTitle } from "@/lib/itinerary/documentTitle";
import { UntouchedCopyGuard } from "../itinerary/UntouchedCopyGuard";
import { keepDateLabelsInSlots } from "@/lib/itinerary/dayReorder";
import type { PdfTrustContent } from "@/lib/itinerary/pdfTrustContent";
import type { PdfSocialLinks } from "@/lib/pdf/contact";
import { genId, type ListItem, type CancelTier } from "@/types/itinerary";
import {
  type ProposalData,
  type ProposalDay,
  type StayPlanRow,
  type TransportRow,
  type ComparisonRow,
  type ProposalDocType,
  type ProposalStatus,
  type ProposalTier,
  type ProposalTierKey,
  TIER_ORDER,
  SINGLE_TIER_KEY,
  COMPARISON_DASH,
  COMPARISON_CHECK,
  stayHotelField,
  transportVehicleField,
  deriveStayPlan,
} from "@/types/proposal";

type ListKey = "pay";

interface ProposalEditorProps {
  id?: string;
  initialData: ProposalData;
  /** Saved title — shown until the first edit (a copy's is "… - copy"). */
  initialTitle?: string;
  initialStatus: ProposalStatus;
  canSave?: boolean;
  /** Current user authored this record and may edit + delete it — see UntouchedCopyGuard. */
  ownsCopy?: boolean;
  companyAddress?: string;
  trustContent?: PdfTrustContent;
  socialLinks?: PdfSocialLinks;
  apiBasePath?: string;
  /** May create itineraries — shows "Convert to Itinerary". */
  canConvert?: boolean;
  /** Day Plans library access: pick plans into days / save a day as a new plan. */
  dayPlans?: { canPick: boolean; canSave: boolean };
  /** "Assigned to" picker — set when the user may hand this proposal to someone. */
  assignment?: { ownerName: string | null; assignedToId: string | null; staff: AssigneeOption[] };
}

export function ProposalEditor({
  id,
  initialData,
  initialTitle,
  initialStatus,
  canSave = true,
  ownsCopy = false,
  companyAddress,
  trustContent,
  socialLinks,
  apiBasePath = "/api/proposals",
  canConvert = false,
  dayPlans = { canPick: false, canSave: false },
  assignment,
}: ProposalEditorProps) {
  const router = useRouter();
  const [data, setRawData] = useState<ProposalData>(initialData);
  // Every edit goes through resyncDayDates: day dates follow the travel start
  // date and the days' order (a date set by hand stays otherwise).
  const setData = useCallback(
    (update: ProposalData | ((prev: ProposalData) => ProposalData)) =>
      setRawData((prev) =>
        resyncDayDates(prev, typeof update === "function" ? update(prev) : update),
      ),
    [],
  );
  // "<customer> - <duration> - <phone>" from the cover; the API derives the
  // same string on save, so this is what the list will show.
  const title = initialTitle && data === initialData ? initialTitle : buildDocumentTitle(data);
  const [status, setStatus] = useState<ProposalStatus>(initialStatus);
  const [isSaving, setSaving] = useState(false);
  const [isExporting, setExporting] = useState(false);
  const [isConverting, setConverting] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  /* ---------- top-level string fields ---------- */
  const updateField = (field: keyof ProposalData, value: string) =>
    setData((p) => ({ ...p, [field]: value }));

  /* ---------- doc type (Multi-package / Single-package) ---------- */
  // Switching in either direction only sets `docType` — both shapes read the
  // same `data` (days, stay plan, transport, activities…), and the single
  // doc's values are the multi doc's Premium column (SINGLE_TIER_KEY), so
  // nothing is discarded. Only EMPTY fields are filled: the Stay Plan from
  // the days' stay labels (so it matches the day plan), and the multi-only
  // comparison rows / footnote / mixing tip from the multi sample (the single
  // doc leaves those blank) so staff see what belongs there.
  const handleDocTypeChange = (docType: ProposalDocType) =>
    setData((p) => {
      if (p.docType === docType) return p;
      const stayPlan = p.stayPlan.length ? p.stayPlan : deriveStayPlan(p.days, genId);
      if (docType === "single") return { ...p, docType, stayPlan };
      return {
        ...p,
        docType,
        stayPlan,
        comparisonRows: p.comparisonRows.length
          ? p.comparisonRows
          : DEFAULT_PROPOSAL_DATA.comparisonRows,
        comparisonFootnote: p.comparisonFootnote || DEFAULT_PROPOSAL_DATA.comparisonFootnote,
        tipText: p.tipText || DEFAULT_PROPOSAL_DATA.tipText,
      };
    });

  /* ---------- tiers ---------- */
  const updateTier = (
    key: ProposalTierKey,
    field: "label" | "title" | "priceLabel" | "coverNote" | "description" | "badgeLabel",
    value: string,
  ) =>
    setData((p) => ({ ...p, tiers: { ...p.tiers, [key]: { ...p.tiers[key], [field]: value } } }));

  const addTierTag = (key: ProposalTierKey) =>
    setData((p) => ({
      ...p,
      tiers: { ...p.tiers, [key]: { ...p.tiers[key], tags: [...p.tiers[key].tags, "New tag"] } },
    }));
  const updateTierTag = (key: ProposalTierKey, idx: number, value: string) =>
    setData((p) => ({
      ...p,
      tiers: {
        ...p.tiers,
        [key]: { ...p.tiers[key], tags: p.tiers[key].tags.map((t, i) => (i === idx ? value : t)) },
      },
    }));
  const removeTierTag = (key: ProposalTierKey, idx: number) =>
    setData((p) => ({
      ...p,
      tiers: {
        ...p.tiers,
        [key]: { ...p.tiers[key], tags: p.tiers[key].tags.filter((_, i) => i !== idx) },
      },
    }));

  /* ---------- comparison table ---------- */
  const addComparisonRow = () =>
    setData((p) => ({
      ...p,
      comparisonRows: [
        ...p.comparisonRows,
        {
          id: genId("cmp"),
          label: "New row",
          budget: COMPARISON_DASH,
          premium: COMPARISON_DASH,
          luxury: COMPARISON_DASH,
        },
      ],
    }));
  const updateComparisonRow = (
    rowId: string,
    field: "label" | "budget" | "premium" | "luxury",
    value: string,
  ) =>
    setData((p) => ({
      ...p,
      comparisonRows: p.comparisonRows.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)),
    }));
  const removeComparisonRow = (rowId: string) =>
    setData((p) => ({ ...p, comparisonRows: p.comparisonRows.filter((r) => r.id !== rowId) }));

  /* ---------- days ---------- */
  const updateDay = (
    dayId: string,
    field: "title" | "dateLabel" | "body" | "stayLabel" | "highlightsLine" | "mealsLabel" | "image",
    value: string,
  ) =>
    setData((p) => ({
      ...p,
      days: p.days.map((d) => (d.id === dayId ? { ...d, [field]: value } : d)),
    }));
  const addDay = () =>
    setData((p) => ({
      ...p,
      days: [
        ...p.days,
        {
          id: genId("pday"),
          title: "New Day",
          dateLabel: "",
          body: "Describe the day's plan…",
          stayLabel: "",
          highlightsLine: "",
          mealsLabel: "",
          image: "",
        },
      ],
    }));
  const removeDay = (dayId: string) =>
    setData((p) => ({ ...p, days: p.days.filter((d) => d.id !== dayId) }));
  // A picked library plan replaces ONLY the day's heading and description —
  // stay, meals, highlights, photo and date are untouched. The copy is the
  // proposal's own (editable); it never changes the library.
  const [pickForDay, setPickForDay] = useState<string | null>(null);
  const [saveDay, setSaveDay] = useState<ProposalDay | null>(null);
  const applyDayPlan = (dayId: string, plan: DayPlanRecord) =>
    setData((p) => ({
      ...p,
      days: p.days.map((d) => {
        return d.id === dayId ? { ...d, ...toProposalDay(plan) } : d;
      }),
    }));
  const reorderDays = (next: ProposalDay[]) =>
    setData((p) => ({ ...p, days: keepDateLabelsInSlots(p.days, next) }));

  /* ---------- stay plan (single-package only) ---------- */
  const addStayPlanRow = () =>
    setData((p) => ({
      ...p,
      stayPlan: [
        ...p.stayPlan,
        {
          id: genId("sp"),
          destination: "",
          nights: "",
          hotelName: "",
          hotelBudget: "",
          hotelLuxury: "",
          roomType: "Double Sharing",
          rooms: "1",
        },
      ],
    }));
  const updateStayPlanRow = (
    rowId: string,
    field: Exclude<keyof StayPlanRow, "id">,
    value: string,
  ) =>
    setData((p) => ({
      ...p,
      stayPlan: p.stayPlan.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)),
    }));
  const removeStayPlanRow = (rowId: string) =>
    setData((p) => ({ ...p, stayPlan: p.stayPlan.filter((r) => r.id !== rowId) }));
  const reorderStayPlan = (next: StayPlanRow[]) => setData((p) => ({ ...p, stayPlan: next }));

  /* ---------- transportation ---------- */
  const addTransportRow = () =>
    setData((p) => ({
      ...p,
      transport: [
        ...p.transport,
        {
          id: genId("tr"),
          vehicle: "",
          vehicleBudget: "",
          vehicleLuxury: "",
          count: "1",
          seating: "",
          usedFor: "",
          duration: "",
        },
      ],
    }));
  const updateTransportRow = (
    rowId: string,
    field: Exclude<keyof TransportRow, "id">,
    value: string,
  ) =>
    setData((p) => ({
      ...p,
      transport: p.transport.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)),
    }));
  const removeTransportRow = (rowId: string) =>
    setData((p) => ({ ...p, transport: p.transport.filter((r) => r.id !== rowId) }));

  /* ---------- activities (same per-option cells as comparisonRows) ---------- */
  const addActivity = () =>
    setData((p) => ({
      ...p,
      activities: [
        ...p.activities,
        {
          id: genId("act"),
          label: "",
          budget: COMPARISON_DASH,
          premium: COMPARISON_CHECK,
          luxury: COMPARISON_CHECK,
        },
      ],
    }));
  const updateActivity = (
    rowId: string,
    field: Exclude<keyof ComparisonRow, "id">,
    value: string,
  ) =>
    setData((p) => ({
      ...p,
      activities: p.activities.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)),
    }));
  const removeActivity = (rowId: string) =>
    setData((p) => ({ ...p, activities: p.activities.filter((r) => r.id !== rowId) }));

  /* ---------- optional "available on the day" activities ---------- */
  const addOptionalActivity = () =>
    setData((p) => ({
      ...p,
      optionalActivities: [
        ...p.optionalActivities,
        { id: genId("pa"), name: "New Item", place: "", day: "", note: "", price: "" },
      ],
    }));
  const updateOptionalActivity = (
    rowId: string,
    field: "name" | "place" | "day" | "note" | "price",
    value: string,
  ) =>
    setData((p) => ({
      ...p,
      optionalActivities: p.optionalActivities.map((a) =>
        a.id === rowId ? { ...a, [field]: value } : a,
      ),
    }));
  const removeOptionalActivity = (rowId: string) =>
    setData((p) => ({ ...p, optionalActivities: p.optionalActivities.filter((a) => a.id !== rowId) }));

  /* ---------- pay tags / plain string[] lists ---------- */
  const addListItem = (key: ListKey, item: string) =>
    setData((p) => ({ ...p, [key]: [...p[key], item] }));
  const updateListItem = (key: ListKey, idx: number, value: string) =>
    setData((p) => ({ ...p, [key]: p[key].map((v, i) => (i === idx ? value : v)) }));
  const removeListItem = (key: ListKey, idx: number) =>
    setData((p) => ({ ...p, [key]: p[key].filter((_, i) => i !== idx) }));

  /* ---------- inclusions/exclusions (category + text rows) ---------- */
  const addListItemRow = (key: "inc" | "exc") =>
    setData((p) => ({ ...p, [key]: [...p[key], { id: genId("li"), category: "", text: "" }] }));
  const updateListItemRow = (
    key: "inc" | "exc",
    rowId: string,
    field: "category" | "text",
    value: string,
  ) =>
    setData((p) => ({
      ...p,
      [key]: p[key].map((v) => (v.id === rowId ? { ...v, [field]: value } : v)),
    }));
  const removeListItemRow = (key: "inc" | "exc", rowId: string) =>
    setData((p) => ({ ...p, [key]: p[key].filter((v) => v.id !== rowId) }));

  /* ---------- cancellation tiers (label + charge rows) ---------- */
  const addCancelTier = () =>
    setData((p) => ({ ...p, cancel: [...p.cancel, { id: genId("ct"), label: "", charge: "" }] }));
  const updateCancelTier = (rowId: string, field: "label" | "charge", value: string) =>
    setData((p) => ({
      ...p,
      cancel: p.cancel.map((v) => (v.id === rowId ? { ...v, [field]: value } : v)),
    }));
  const removeCancelTier = (rowId: string) =>
    setData((p) => ({ ...p, cancel: p.cancel.filter((v) => v.id !== rowId) }));

  /* ---------- why choose us (title/subtitle per item, icon fixed — same
     as ItineraryEditor's updateWhyChoose) ---------- */
  const updateWhyChoose = (wid: string, field: "title" | "subtitle", value: string) =>
    setData((p) => ({
      ...p,
      whyChoose: p.whyChoose.map((w) => (w.id === wid ? { ...w, [field]: value } : w)),
    }));

  /* ---------- actions ---------- */
  /** Resolves true once the proposal is saved. */
  async function handleSave(): Promise<boolean> {
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
      toast.success("Proposal saved.");
      if (!id && json.id) {
        router.replace(`/admin/proposals/${json.id}`);
      } else {
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

  // Saves first (when allowed) so the itinerary is built from what's on screen.
  async function handleConvert(tier: ProposalTierKey, leadId: string) {
    if (!id) return;
    setConverting(true);
    if (canSave && !(await handleSave())) {
      setConverting(false);
      return;
    }
    try {
      const res = await fetch(`${apiBasePath}/${id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, leadId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Conversion failed");
      toast.success("Itinerary created and linked to the lead.");
      router.push(`/admin/itinerary/${json.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Conversion failed");
      setConverting(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const { bytes } = await downloadProposalPdf(data, companyAddress, trustContent, socialLinks);
      const kb = Math.round(bytes / 1024);
      if (bytes > 1024 * 1024) {
        toast.warning(
          `PDF generated (${(bytes / 1048576).toFixed(2)} MB) — above the 1 MB target.`,
        );
      } else {
        toast.success(`PDF downloaded (${kb} KB).`);
      }
      if (id && status === "DRAFT") {
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

  function handleReset() {
    if (confirm("Reset all content to the default proposal? Unsaved changes will be lost.")) {
      setData(data.docType === "single" ? DEFAULT_SINGLE_PROPOSAL_DATA : DEFAULT_PROPOSAL_DATA);
    }
  }

  const isMulti = data.docType === "multi";
  const greenHead = "font-serif text-2xl font-bold text-[hsl(156_40%_21%)] dark:text-primary";
  const pageCard =
    "page rounded-xl border border-[hsl(40_14%_87%)] bg-white p-5 shadow-page dark:border-mute/20 dark:bg-card sm:p-8 md:p-12";
  const addBtn =
    "addbtn mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[hsl(156_40%_21%)]/40 px-3 py-1.5 text-xs font-bold text-[hsl(156_40%_21%)] transition hover:bg-[hsl(150_28%_92%)]/60 dark:border-primary/40 dark:text-primary dark:hover:bg-primary/10 no-print";
  const fieldLabel =
    "block text-[11px] font-semibold uppercase tracking-wide text-mute dark:text-muted-foreground mb-1";
  // Shown only on phones, where table-style column headings are hidden.
  const mobileLabel = `${fieldLabel} sm:hidden`;
  // Short one-line row fields (stay plan / transport): bordered inputs,
  // 16px on phones so iOS doesn't zoom on focus.
  const rowInput =
    "w-full rounded-md border border-[hsl(40_14%_87%)]/80 bg-transparent px-2 py-1.5 outline-none transition-all focus:bg-muted/30 focus:ring-1 focus:ring-primary/30 dark:border-white/10 max-md:text-[16px] print:border-none print:p-0";


  return (
    <div className="pb-8">
      <Toolbar
        title={title}
        status={status}
        onStatusChange={setStatus}
        docType={data.docType}
        onDocTypeChange={handleDocTypeChange}
        onSave={handleSave}
        onExport={handleExport}
        onReset={handleReset}
        isSaving={isSaving}
        isExporting={isExporting}
        canSave={canSave}
        onConvert={id && canConvert ? () => setConvertOpen(true) : undefined}
        isConverting={isConverting}
      />
      <ConvertToItineraryDialog
        open={convertOpen}
        onClose={() => setConvertOpen(false)}
        onConvert={handleConvert}
        options={
          isMulti
            ? TIER_ORDER.map((key) => ({
                key,
                label: [data.tiers[key].label, data.tiers[key].priceLabel].filter(Boolean).join(" · "),
              }))
            : []
        }
        isConverting={isConverting}
      />
      {id && initialTitle && (
        <UntouchedCopyGuard
          active={ownsCopy && isCopyTitle(initialTitle)}
          deleteUrl={`${apiBasePath}/${id}`}
          noun="proposal"
        />
      )}

      <div className="px-3 py-7 sm:px-5">
        <div className="mx-auto max-w-[920px] space-y-8">
          {id && assignment && (
            <ProposalAssignee
              proposalId={id}
              ownerName={assignment.ownerName}
              initialAssigneeId={assignment.assignedToId}
              staff={assignment.staff}
              apiBasePath={apiBasePath}
            />
          )}
          {/* Cover */}
          <article id="ps-cover" className={`${pageCard} scroll-mt-32`}>
            <h2 className={greenHead}>Cover</h2>
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
              <div>
                <label className={fieldLabel}>Quote Number</label>
                <input
                  value={data.quoteNumber}
                  onChange={(e) => updateField("quoteNumber", e.target.value)}
                  className={rowInput}
                />
              </div>
              <div>
                <label className={fieldLabel}>Duration</label>
                <input
                  value={data.duration}
                  onChange={(e) => updateField("duration", e.target.value)}
                  className={rowInput}
                />
              </div>
              <div>
                <label className={fieldLabel}>Travel Dates</label>
                <input
                  value={data.travelDates}
                  onChange={(e) => updateField("travelDates", e.target.value)}
                  className={rowInput}
                />
              </div>
              <div>
                <label className={fieldLabel}>Prepared For</label>
                <input
                  value={data.preparedFor}
                  onChange={(e) => updateField("preparedFor", e.target.value)}
                  className={rowInput}
                />
              </div>
              <div>
                <label className={fieldLabel}>Customer Phone</label>
                <input
                  value={data.customerPhone}
                  onChange={(e) => updateField("customerPhone", e.target.value)}
                  placeholder="+91 ..."
                  className={rowInput}
                />
              </div>
              <div>
                <label className={fieldLabel}>Travellers</label>
                <input
                  value={data.travelers}
                  onChange={(e) => updateField("travelers", e.target.value)}
                  className={rowInput}
                />
              </div>
              <div>
                <label className={fieldLabel}>Prepared By</label>
                <input
                  value={data.preparedByName}
                  onChange={(e) => updateField("preparedByName", e.target.value)}
                  placeholder="Staff name"
                  className={rowInput}
                />
              </div>
              <div>
                <label className={fieldLabel}>Prepared By — Phone</label>
                <input
                  value={data.preparedByPhone}
                  onChange={(e) => updateField("preparedByPhone", e.target.value)}
                  placeholder="+91 ..."
                  className={rowInput}
                />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={fieldLabel}>Title</label>
                <input
                  value={data.coverTitle}
                  onChange={(e) => updateField("coverTitle", e.target.value)}
                  className={`${rowInput} text-lg font-bold`}
                />
              </div>
              <div>
                <label className={fieldLabel}>Subtitle</label>
                <input
                  value={data.coverSubtitle}
                  onChange={(e) => updateField("coverSubtitle", e.target.value)}
                  className={`${rowInput} text-lg font-bold`}
                />
              </div>
            </div>
            <div className="mt-5">
              <label className={fieldLabel}>Intro Paragraph</label>
              <EditableField
                value={data.coverIntro}
                onValueChange={(v) => updateField("coverIntro", v)}
                rows={2}
                className={rowInput}
              />
            </div>
            <div className="mt-5">
              <label className={fieldLabel}>Cover Image</label>
              <ProposalImageSlot
                src={data.coverImage}
                onChange={(src) => updateField("coverImage", src)}
                className="h-40"
              />
            </div>
          </article>

          {/* Pricing Tiers — the single-package doc reuses this exact same
              tier-card editor, just for one fixed slot (SINGLE_TIER_KEY)
              instead of looping over all three. */}
          <article id="ps-packages" className={`${pageCard} scroll-mt-32`}>
            <h2 className={greenHead}>
              {data.docType === "multi" ? "Your Three Options" : "Package & Price"}
            </h2>
            <div className="mt-6 space-y-5">
              {(data.docType === "multi" ? TIER_ORDER : [SINGLE_TIER_KEY]).map((key) => {
                const tier: ProposalTier = data.tiers[key];
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-[hsl(40_14%_87%)] p-4 dark:border-mute/20"
                  >
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <label className={fieldLabel}>Label</label>
                        <input
                          value={tier.label}
                          onChange={(e) => updateTier(key, "label", e.target.value)}
                          className={rowInput}
                        />
                      </div>
                      <div>
                        <label className={fieldLabel}>Card Title</label>
                        <input
                          value={tier.title}
                          onChange={(e) => updateTier(key, "title", e.target.value)}
                          className={rowInput}
                        />
                      </div>
                      <div>
                        <label className={fieldLabel}>Price</label>
                        <input
                          value={tier.priceLabel}
                          onChange={(e) => updateTier(key, "priceLabel", e.target.value)}
                          className={`${rowInput} font-bold`}
                        />
                      </div>
                      <div>
                        <label className={fieldLabel}>Cover Note</label>
                        <input
                          value={tier.coverNote}
                          onChange={(e) => updateTier(key, "coverNote", e.target.value)}
                          className={rowInput}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className={fieldLabel}>Description</label>
                      <EditableField
                        value={tier.description}
                        onValueChange={(v) => updateTier(key, "description", v)}
                        rows={2}
                        className={rowInput}
                      />
                    </div>
                    <div className="mt-3">
                      <label className={fieldLabel}>
                        Badge (e.g. &quot;MOST CHOSEN&quot;, blank = none)
                      </label>
                      <input
                        value={tier.badgeLabel}
                        onChange={(e) => updateTier(key, "badgeLabel", e.target.value)}
                        placeholder="Blank = no badge"
                        className={`${rowInput} max-w-[220px]`}
                      />
                    </div>
                    <div className="mt-3">
                      <label className={fieldLabel}>Tags</label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {tier.tags.map((tag, idx) => (
                          <ChipInput
                            key={idx}
                            value={tag}
                            onChange={(v) => updateTierTag(key, idx, v)}
                            onRemove={() => removeTierTag(key, idx)}
                            label={`Tag ${idx + 1}`}
                          />
                        ))}
                      </div>
                      <button onClick={() => addTierTag(key)} className={addBtn}>
                        <Plus className="h-2.5 w-2.5" /> tag
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {data.docType === "multi" ? (
              <div className="mt-6">
                <label className={fieldLabel}>Mixing Tip (below the option cards)</label>
                <EditableField
                  value={data.tipText}
                  onValueChange={(v) => updateField("tipText", v)}
                  rows={2}
                  className={rowInput}
                />
              </div>
            ) : null}
          </article>

          {/* Comparison table — multi-package only; the single-package doc
              has only one option, nothing to compare. */}
          {data.docType !== "multi" ? null : (
            <article id="ps-compare" className={`${pageCard} scroll-mt-32`}>
              <h2 className={greenHead}>What Actually Differs</h2>
              <p className="mt-2 text-xs text-mute dark:text-muted-foreground">
                Hotels, vehicles and activities are compared automatically from the Stay Plan,
                Transportation and Activities sections — add only other differences here (meals,
                support…).
              </p>
              {/* Static column headings — the rows below have no labels of
                their own on each cell, so this is the only thing telling
                staff which column is which. */}
              <div className="mt-6 hidden grid-cols-4 gap-x-3 px-3 sm:grid">
                <span className={fieldLabel}>Feature</span>
                <span className={fieldLabel}>Budget</span>
                <span className={fieldLabel}>Premium</span>
                <span className={fieldLabel}>Luxury</span>
              </div>
              <div className="mt-2 space-y-3">
                {data.comparisonRows.map((row) => (
                  <div
                    key={row.id}
                    className="group relative grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-[hsl(40_14%_87%)] p-3 pr-8 dark:border-mute/20 sm:grid-cols-4"
                  >
                    <EditableField
                      value={row.label}
                      onValueChange={(v) => updateComparisonRow(row.id, "label", v)}
                      placeholder="Feature"
                      className="col-span-2 text-sm font-bold sm:col-span-1"
                    />
                    {TIER_ORDER.map((tk) => (
                      <div key={tk} className="col-span-2 sm:col-span-1">
                        <span className={mobileLabel}>{data.tiers[tk].label}</span>
                        <OptionCell
                          tierKey={tk}
                          value={row[tk]}
                          onChange={(v) => updateComparisonRow(row.id, tk, v)}
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => removeComparisonRow(row.id)}
                      aria-label={`Remove row ${row.label}`}
                      className="absolute right-2 top-1/2 hidden -translate-y-1/2 text-rose-500 hover:text-rose-600 group-hover:block no-print [@media(hover:none)]:block"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addComparisonRow} className={addBtn}>
                <Plus className="h-3 w-3" /> Add row
              </button>
              <div className="mt-5">
                <label className={fieldLabel}>Footnote</label>
                <EditableField
                  value={data.comparisonFootnote}
                  onValueChange={(v) => updateField("comparisonFootnote", v)}
                  rows={2}
                />
              </div>
            </article>
          )}

          {/* Days — the single-package doc's "Day Plan at a Glance" table
              reads the same `days` array, plus its Meals column (blank/unused
              in multi-package). */}
          <article id="ps-days" className={`${pageCard} scroll-mt-32`}>
            <h2 className={greenHead}>
              {data.docType === "multi" ? "Your Six Days" : "Day Plan at a Glance"}
            </h2>
            <ReorderableList
              items={data.days}
              onReorder={reorderDays}
              noun="day"
              className="mt-6 space-y-3"
            >
              {(day, dayIdx) => (
                <div className="group relative rounded-xl border border-[hsl(40_14%_87%)] p-4 dark:border-mute/20">
                  <button
                    onClick={() => removeDay(day.id)}
                    aria-label={`Remove day ${dayIdx + 1}`}
                    className="absolute -left-2 -top-2 z-20 hidden h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white opacity-0 transition-opacity group-hover:flex group-hover:opacity-100 no-print [@media(hover:none)]:flex [@media(hover:none)]:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  {/* Phones: title, then the date on its own line under it
                      (same as ItineraryEditor). sm+: date on the right. */}
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                        <div className="flex min-w-0 flex-1 items-baseline gap-3">
                          <span className="w-8 shrink-0 font-serif text-xl font-bold text-[#B8D4C4] sm:w-auto">
                            {String(dayIdx + 1).padStart(2, "0")}
                          </span>
                          <EditableField
                            value={day.title}
                            onValueChange={(v) => updateDay(day.id, "title", v)}
                            className="min-w-0 flex-1 text-sm font-bold"
                          />
                        </div>
                        {/* Filled from the travel start date (resyncDayDates); blank = not printed. */}
                        <input
                          type="date"
                          aria-label={`Day ${dayIdx + 1} date`}
                          value={stayDateInputValue(day.dateLabel)}
                          onChange={(e) => updateDay(day.id, "dateLabel", e.target.value)}
                          className="ml-12 w-36 text-xs text-mute dark:text-muted-foreground sm:ml-0 sm:shrink-0 rounded-md border border-[hsl(40_14%_87%)]/80 bg-transparent px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary/30 dark:border-white/10"
                        />
                      </div>
                      <EditableField
                        value={day.body}
                        onValueChange={(v) => updateDay(day.id, "body", v)}
                        rows={2}
                        className="mt-2 block text-sm"
                      />
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="min-w-0">
                          <label className={fieldLabel}>Stay</label>
                          <input
                            value={day.stayLabel}
                            onChange={(e) => updateDay(day.id, "stayLabel", e.target.value)}
                            placeholder="Blank on departure day"
                            className={`${rowInput} text-sm`}
                          />
                        </div>
                        {data.docType === "multi" ? (
                          <div className="min-w-0">
                            <label className={fieldLabel}>Highlights</label>
                            <input
                              value={day.highlightsLine}
                              onChange={(e) => updateDay(day.id, "highlightsLine", e.target.value)}
                              placeholder="Highlights"
                              className={`${rowInput} text-sm`}
                            />
                          </div>
                        ) : (
                          <div className="min-w-0">
                            <label className={fieldLabel}>Meals</label>
                            <input
                              value={day.mealsLabel}
                              onChange={(e) => updateDay(day.id, "mealsLabel", e.target.value)}
                              placeholder="Breakfast, Dinner"
                              className={`${rowInput} text-sm`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <ProposalImageSlot
                      src={day.image}
                      onChange={(src) => updateDay(day.id, "image", src)}
                      className="h-32 sm:h-auto sm:min-h-28 sm:w-40 sm:shrink-0"
                    />
                  </div>
                  {(dayPlans.canPick || dayPlans.canSave) && (
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-dashed border-[hsl(40_14%_87%)] pt-2.5 no-print dark:border-mute/20">
                      {!dayPlans.canPick && <span />}
                      {dayPlans.canPick && (
                        <button
                          type="button"
                          onClick={() => setPickForDay(day.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[hsl(156_40%_21%)] px-2.5 py-1 text-xs font-bold text-white hover:brightness-110 dark:bg-primary dark:text-primary-foreground"
                        >
                          <Sparkles className="h-3 w-3" /> Pick from library
                        </button>
                      )}
                      {dayPlans.canSave && (
                        <button
                          type="button"
                          onClick={() => setSaveDay(day)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(40_14%_87%)] px-2.5 py-1 text-xs font-bold text-mute hover:text-foreground dark:border-mute/20 dark:text-muted-foreground"
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
                onPick={(plan) => applyDayPlan(pickForDay, plan)}
              />
            )}
            {saveDay && (
              <DayPlanFormDialog
                open
                onOpenChange={(o) => !o && setSaveDay(null)}
                title="Save this day to the library"
                initial={{
                  ...EMPTY_DAY_PLAN,
                  ...guessRoute(saveDay.title),
                  title: saveDay.title,
                  body: saveDay.body,
                }}
                onSaved={() => {}}
              />
            )}
            <button onClick={addDay} className={addBtn}>
              <Plus className="h-3 w-3" /> Add day
            </button>
          </article>

          {/* Stay Plan — both docs. Single: one hotel per row. Multi: one
              hotel per option (Premium = the single doc's hotel), printed as
              the comparison table's "Stays" section. */}
          <article id="ps-stays" className={`${pageCard} scroll-mt-32`}>
            <h2 className={greenHead}>{isMulti ? "Stay Plan — Hotel per Option" : "Stay Plan"}</h2>
            <div
              className={`mt-6 hidden gap-x-3 px-3 sm:grid ${isMulti ? "grid-cols-3" : "grid-cols-5"}`}
            >
              <span className={fieldLabel}>Destination</span>
              <span className={fieldLabel}>Nights</span>
              {isMulti ? null : <span className={fieldLabel}>Hotel Name</span>}
              {isMulti ? null : <span className={fieldLabel}>Room Type</span>}
              <span className={fieldLabel}>No. of Rooms</span>
            </div>
            <ReorderableList
              items={data.stayPlan}
              onReorder={reorderStayPlan}
              noun="stay plan row"
              className="mt-2 space-y-3"
            >
              {(row) => (
                <div className="group relative rounded-xl border border-[hsl(40_14%_87%)] p-3 pr-8 dark:border-mute/20">
                  {/* Phones: the column headings above are hidden, so each
                      field carries its own label (mobileLabel) and the order
                      is Destination / Nights + Rooms / Hotel / Room Type.
                      sm+: one row under the headings, labels hidden. */}
                  <div
                    className={`grid grid-cols-2 gap-x-3 gap-y-2 ${isMulti ? "sm:grid-cols-3" : "sm:grid-cols-5"}`}
                  >
                    <div className="order-1 col-span-2 sm:order-none sm:col-span-1">
                      <span className={mobileLabel}>Destination</span>
                      <input
                        value={row.destination}
                        onChange={(e) => updateStayPlanRow(row.id, "destination", e.target.value)}
                        placeholder="Destination"
                        className={`${rowInput} text-sm font-bold`}
                      />
                    </div>
                    <div className="order-2 sm:order-none">
                      <span className={mobileLabel}>Nights</span>
                      <input
                        value={row.nights}
                        onChange={(e) => updateStayPlanRow(row.id, "nights", e.target.value)}
                        placeholder="Nights"
                        className={`${rowInput} text-xs`}
                      />
                    </div>
                    {isMulti ? null : (
                      <div className="order-4 col-span-2 sm:order-none sm:col-span-1">
                        <span className={mobileLabel}>Hotel Name</span>
                        <EditableField
                          value={row.hotelName}
                          onValueChange={(v) => updateStayPlanRow(row.id, "hotelName", v)}
                          placeholder="Hotel Name / Similar"
                          className={`${rowInput} text-xs`}
                        />
                      </div>
                    )}
                    {/* Multi compares room class per option in the
                        comparison rows ("Room category") instead. */}
                    {isMulti ? null : (
                      <div className="order-5 col-span-2 sm:order-none sm:col-span-1">
                        <span className={mobileLabel}>Room Type</span>
                        <input
                          value={row.roomType}
                          onChange={(e) => updateStayPlanRow(row.id, "roomType", e.target.value)}
                          placeholder="Room Type"
                          className={`${rowInput} text-xs`}
                        />
                      </div>
                    )}
                    <div className="order-3 sm:order-none">
                      <span className={mobileLabel}>No. of Rooms</span>
                      <input
                        value={row.rooms}
                        onChange={(e) => updateStayPlanRow(row.id, "rooms", e.target.value)}
                        placeholder="1"
                        className={`${rowInput} text-xs`}
                      />
                    </div>
                  </div>
                  {isMulti ? (
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {TIER_ORDER.map((tk) => (
                        <div key={tk}>
                          <label className={fieldLabel}>{data.tiers[tk].label} hotel</label>
                          <EditableField
                            value={row[stayHotelField(tk)]}
                            onValueChange={(v) => updateStayPlanRow(row.id, stayHotelField(tk), v)}
                            placeholder="Hotel Name / Similar"
                            className={`${rowInput} text-xs`}
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <button
                    onClick={() => removeStayPlanRow(row.id)}
                    aria-label={`Remove stay plan row ${row.destination}`}
                    className="absolute right-2 top-3 hidden text-rose-500 hover:text-rose-600 group-hover:block no-print sm:top-1/2 sm:-translate-y-1/2 [@media(hover:none)]:block"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </ReorderableList>
            <button onClick={addStayPlanRow} className={addBtn}>
              <Plus className="h-3 w-3" /> Add row
            </button>
            <div className="mt-5">
              <label className={fieldLabel}>Note</label>
              <EditableField
                value={data.stayPlanNote}
                onValueChange={(v) => updateField("stayPlanNote", v)}
                rows={2}
              />
            </div>
          </article>

          {/* Transportation — same single/multi split as Stay Plan. */}
          <article id="ps-transport" className={`${pageCard} scroll-mt-32`}>
            <h2 className={greenHead}>
              {isMulti ? "Transportation — Vehicle per Option" : "Transportation"}
            </h2>
            <div
              className={`mt-6 hidden gap-x-3 px-3 sm:grid ${isMulti ? "grid-cols-4" : "grid-cols-5"}`}
            >
              <span className={fieldLabel}>{isMulti ? "Used For" : "Vehicle"}</span>
              <span className={fieldLabel}>No. of vehicles</span>
              <span className={fieldLabel}>Seating</span>
              {isMulti ? null : <span className={fieldLabel}>Used For</span>}
              <span className={fieldLabel}>Duration</span>
            </div>
            <div className="mt-2 space-y-3">
              {data.transport.map((row) => (
                <div
                  key={row.id}
                  className="group relative rounded-xl border border-[hsl(40_14%_87%)] p-3 pr-8 dark:border-mute/20"
                >
                  {/* Phones (4 cols): Vehicle or Used For + No. / Seating +
                      Duration / Used For (single, full width). sm+: one row
                      under the column headings. */}
                  <div
                    className={`grid grid-cols-4 gap-x-3 gap-y-2 ${isMulti ? "sm:grid-cols-4" : "sm:grid-cols-5"}`}
                  >
                    {isMulti ? null : (
                      <div className="order-1 col-span-3 sm:order-none sm:col-span-1">
                        <span className={mobileLabel}>Vehicle</span>
                        <input
                          value={row.vehicle}
                          onChange={(e) => updateTransportRow(row.id, "vehicle", e.target.value)}
                          placeholder="Sedan"
                          className={`${rowInput} text-sm font-bold`}
                        />
                      </div>
                    )}
                    {isMulti ? (
                      <div className="order-1 col-span-3 sm:order-none sm:col-span-1">
                        <span className={mobileLabel}>Used For</span>
                        <input
                          value={row.usedFor}
                          onChange={(e) => updateTransportRow(row.id, "usedFor", e.target.value)}
                          placeholder="Used for"
                          className={`${rowInput} text-sm font-bold`}
                        />
                      </div>
                    ) : null}
                    <div className="order-2 sm:order-none">
                      <span className={mobileLabel}>No.</span>
                      <input
                        value={row.count}
                        onChange={(e) =>
                          updateTransportRow(row.id, "count", e.target.value.replace(/\D/g, "").slice(0, 2))
                        }
                        inputMode="numeric"
                        placeholder="1"
                        className={`${rowInput} text-xs`}
                      />
                    </div>
                    <div className="order-2 col-span-2 sm:order-none sm:col-span-1">
                      <span className={mobileLabel}>Seating</span>
                      <input
                        value={row.seating}
                        onChange={(e) => updateTransportRow(row.id, "seating", e.target.value)}
                        placeholder="04 + driver"
                        className={`${rowInput} text-xs`}
                      />
                    </div>
                    {isMulti ? null : (
                      <div className="order-4 col-span-4 sm:order-none sm:col-span-1">
                        <span className={mobileLabel}>Used For</span>
                        <input
                          value={row.usedFor}
                          onChange={(e) => updateTransportRow(row.id, "usedFor", e.target.value)}
                          placeholder="Used for"
                          className={`${rowInput} text-xs`}
                        />
                      </div>
                    )}
                    <div className="order-3 col-span-2 sm:order-none sm:col-span-1">
                      <span className={mobileLabel}>Duration</span>
                      <input
                        value={row.duration}
                        onChange={(e) => updateTransportRow(row.id, "duration", e.target.value)}
                        placeholder="06 Days"
                        className={`${rowInput} text-xs`}
                      />
                    </div>
                  </div>
                  {isMulti ? (
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {TIER_ORDER.map((tk) => (
                        <div key={tk}>
                          <label className={fieldLabel}>{data.tiers[tk].label} vehicle</label>
                          <OptionCell
                            tierKey={tk}
                            value={row[transportVehicleField(tk)]}
                            onChange={(v) =>
                              updateTransportRow(row.id, transportVehicleField(tk), v)
                            }
                            placeholder="Sedan"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <button
                    onClick={() => removeTransportRow(row.id)}
                    aria-label={`Remove transport row ${row.vehicle}`}
                    className="absolute right-2 top-3 hidden text-rose-500 hover:text-rose-600 group-hover:block no-print sm:top-1/2 sm:-translate-y-1/2 [@media(hover:none)]:block"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addTransportRow} className={addBtn}>
              <Plus className="h-3 w-3" /> Add row
            </button>
            <div className="mt-5">
              <label className={fieldLabel}>Note</label>
              <EditableField
                value={data.transportNote}
                onValueChange={(v) => updateField("transportNote", v)}
                rows={2}
              />
            </div>
          </article>

          {/* Activities — multi: one cell per option (✓ / – / text), printed
              as the comparison's "Activities" section. Single: the Premium
              cell is the detail; a dash leaves the activity out of the PDF. */}
          <article id="ps-activities" className={`${pageCard} scroll-mt-32`}>
            <h2 className={greenHead}>
              {isMulti ? "Activities — per Option" : "Activities Included"}
            </h2>
            {/* One card per activity with labelled inputs (same feel as the
                itinerary's activity cards; proposals have no activity photo). */}
            <div className="mt-6 space-y-3">
              {data.activities.map((row) => (
                <div
                  key={row.id}
                  className={`relative grid grid-cols-1 gap-x-3 gap-y-2 rounded-xl border border-[hsl(40_14%_87%)] p-3 pr-10 dark:border-mute/20 ${isMulti ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
                >
                  <div className={isMulti ? "sm:col-span-3" : ""}>
                    <label className={fieldLabel}>Activity</label>
                    <input
                      value={row.label}
                      onChange={(e) => updateActivity(row.id, "label", e.target.value)}
                      placeholder="Shikara ride"
                      className={`${rowInput} text-sm font-bold`}
                    />
                  </div>
                  {(isMulti ? TIER_ORDER : [SINGLE_TIER_KEY]).map((tk) => (
                    <div key={tk}>
                      <label className={fieldLabel}>
                        {isMulti ? data.tiers[tk].label : "Details (✓ = included)"}
                      </label>
                      <OptionCell
                        tierKey={tk}
                        value={row[tk]}
                        onChange={(v) => updateActivity(row.id, tk, v)}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => removeActivity(row.id)}
                    aria-label={`Remove activity ${row.label}`}
                    className="absolute right-3 top-3 text-rose-500 hover:text-rose-600 no-print"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addActivity} className={addBtn}>
              <Plus className="h-3 w-3" /> Add activity
            </button>

            {/* "Available on the day" — paid locally, not in any option's
                price. Can be emptied; the PDF then omits it. */}
            <PriceActivitySection
              title="Available on the Day"
              items={data.optionalActivities}
              onUpdate={updateOptionalActivity}
              onRemove={removeOptionalActivity}
              onAdd={addOptionalActivity}
              addLabel="Add Activity"
            />
          </article>

          {/* What's Covered */}
          <article id="ps-covered" className={`${pageCard} scroll-mt-32`}>
            <h2 className={greenHead}>What&apos;s Covered</h2>
            <div className="mt-8 space-y-10">
              <ListColumn
                title="Included in every option"
                items={data.inc}
                tone="inc"
                onUpdateCategory={(rid, v) => updateListItemRow("inc", rid, "category", v)}
                onUpdateText={(rid, v) => updateListItemRow("inc", rid, "text", v)}
                onRemove={(rid) => removeListItemRow("inc", rid)}
                onAdd={() => addListItemRow("inc")}
                addLabel="Add inclusion"
              />
              <ListColumn
                title="Paid separately"
                items={data.exc}
                tone="exc"
                onUpdateCategory={(rid, v) => updateListItemRow("exc", rid, "category", v)}
                onUpdateText={(rid, v) => updateListItemRow("exc", rid, "text", v)}
                onRemove={(rid) => removeListItemRow("exc", rid)}
                onAdd={() => addListItemRow("exc")}
                addLabel="Add exclusion"
              />
            </div>
            <div className="mt-8">
              <label className={fieldLabel}>Policy Note (snow/road closure)</label>
              <EditableField
                value={data.policyNote}
                onValueChange={(v) => updateField("policyNote", v)}
                rows={2}
              />
            </div>
          </article>

          {/* Payment & Cancellation — same 3-column card + tier table pattern
              as ItineraryEditor.tsx, same field names. */}
          <article id="ps-payment" className={`${pageCard} scroll-mt-32`}>
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
                      onValueChange={(v) => updateField("payStep1Title", v)}
                      className="min-w-0 flex-1 text-sm font-bold"
                    />
                  </div>
                  <EditableField
                    value={data.payStep1Desc}
                    onValueChange={(v) => updateField("payStep1Desc", v)}
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
                      onValueChange={(v) => updateField("payStep2Title", v)}
                      className="min-w-0 flex-1 text-sm font-bold"
                    />
                  </div>
                  <EditableField
                    value={data.payStep2Desc}
                    onValueChange={(v) => updateField("payStep2Desc", v)}
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
                    onValueChange={(v) => updateField("payNote", v)}
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
                  className={addBtn}
                >
                  <Plus className="h-2.5 w-2.5" /> note
                </button>
              </div>
            </div>
          </article>

          {/* Why Choose Us — editable like the main Itinerary module's "Why
              Choose Vertex" (title/subtitle per item, icon fixed per item). */}
          <article id="ps-why-us" className={`${pageCard} scroll-mt-32`}>
            <h2 className={greenHead}>Why Choose Us</h2>
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
          </article>

          {/* Closing */}
          <article id="ps-confirm" className={`${pageCard} scroll-mt-32`}>
            <h2 className={greenHead}>How to Confirm</h2>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {(
                [
                  ["confirmStep1Title", "confirmStep1Desc"],
                  ["confirmStep2Title", "confirmStep2Desc"],
                  ["confirmStep3Title", "confirmStep3Desc"],
                ] as const
              ).map(([titleField, descField], i) => (
                <div key={titleField}>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(150_28%_92%)] text-xs font-bold text-[hsl(156_40%_21%)] dark:bg-primary/15 dark:text-primary">
                    {i + 1}
                  </span>
                  <EditableField
                    value={data[titleField]}
                    onValueChange={(v) => updateField(titleField, v)}
                    className="mt-2 text-sm font-bold"
                  />
                  <EditableField
                    value={data[descField]}
                    onValueChange={(v) => updateField(descField, v)}
                    rows={2}
                    className="mt-1 text-xs text-mute dark:text-muted-foreground"
                  />
                </div>
              ))}
            </div>
            <div className="mt-6">
              <label className={fieldLabel}>Hold Note (e.g. &quot;valid for 7 days&quot;)</label>
              <EditableField
                value={data.closingHoldNote}
                onValueChange={(v) => updateField("closingHoldNote", v)}
                rows={2}
              />
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

/** One option's cell — free text plus ✓ / – shortcuts (the comparison
 *  sentinels, see src/types/proposal.ts). */
/** Optional photo slot (cover / day) — blank shows a placeholder; the PDF
 *  simply leaves the photo out. */
function ProposalImageSlot({
  src,
  onChange,
  className,
}: {
  src: string;
  onChange: (src: string) => void;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-dashed border-[hsl(40_14%_80%)] bg-[hsl(40_20%_96%)] dark:border-mute/30 dark:bg-mute/10 ${className ?? ""}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-xs text-mute dark:text-muted-foreground">
          No image
        </span>
      )}
      <div className="absolute right-2 top-2 z-10 flex gap-1.5">
        <ImagePicker value={src} onChange={onChange} label={src ? "Replace" : "Add image"} />
        {src ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove image"
            className="inline-flex items-center rounded-lg bg-black/55 px-2 py-1 text-white backdrop-blur transition hover:bg-black/70 no-print"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function OptionCell({
  tierKey,
  value,
  onChange,
  placeholder,
}: {
  tierKey: ProposalTierKey;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <EditableField
        value={value}
        onValueChange={onChange}
        placeholder={placeholder ?? "✓ / – / details"}
        className="min-w-0 flex-1 border border-[hsl(40_14%_87%)]/80 px-2 py-1.5 text-sm dark:border-white/10 print:border-none"
      />
      <button
        type="button"
        onClick={() => onChange(COMPARISON_CHECK)}
        aria-label={`Set ${tierKey} to included`}
        className="shrink-0 rounded border border-[hsl(40_14%_87%)] px-1 text-[10px] text-[hsl(156_40%_21%)] no-print max-md:px-2.5 max-md:py-1.5 max-md:text-sm"
      >
        ✓
      </button>
      <button
        type="button"
        onClick={() => onChange(COMPARISON_DASH)}
        aria-label={`Set ${tierKey} to not included`}
        className="shrink-0 rounded border border-[hsl(40_14%_87%)] px-1 text-[10px] text-mute no-print max-md:px-2.5 max-md:py-1.5 max-md:text-sm"
      >
        –
      </button>
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
  tone: "inc" | "exc";
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
          <li key={item.id} className="group relative flex items-start gap-2.5 pr-7">
            <span
              className={`mt-1.5 flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full text-white ${tone === "inc" ? "bg-[hsl(156_40%_21%)] dark:bg-primary" : "bg-rose-500"}`}
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
                {tone === "inc" ? <path d="M20 6 9 17l-5-5" /> : <path d="M18 6 6 18M6 6l12 12" />}
              </svg>
            </span>
            <div className="min-w-0 flex-1">
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
