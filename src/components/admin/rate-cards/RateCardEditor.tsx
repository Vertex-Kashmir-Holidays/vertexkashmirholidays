"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Ban, CheckCircle2, Copy, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/admin/connect/ConfirmDialog";
import {
  RATE_CARD_STATUS_STYLES,
  UNION_CAB_VEHICLES,
  type RateCardData,
  type RateCardMeta,
  type RateCardTier,
} from "@/lib/rateCards/schema";
import { getActivationBlockers, getRateCardWarnings } from "@/lib/rateCards/checks";
import {
  AddRowButton,
  AmountInput,
  RowActions,
  Section,
  StringListEditor,
  cellCls,
  errorMessage,
  inputCls,
  labelCls,
  moveItem,
  replaceAt,
} from "./fields";
import { LOCATIONS_LIST_ID, TierEditor } from "./TierEditor";
import { RevisionsPanel } from "./RevisionsPanel";

export interface RateCardEditorProps {
  id: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  version: number;
  updatedAt: string;
  updatedByName: string | null;
  meta: RateCardMeta;
  data: RateCardData;
  canDuplicate: boolean;
}

const DEFAULT_LOCATIONS = ["Srinagar", "Pahalgam", "Gulmarg", "Sonamarg", "Dal Lake"];

/** Drop blank list rows and renumber tier order to match the on-screen order. */
function cleanForSave(data: RateCardData): RateCardData {
  return {
    ...data,
    activitiesIncluded: data.activitiesIncluded.map((s) => s.trim()).filter(Boolean),
    unionCabIncluded: data.unionCabIncluded.map((s) => s.trim()).filter(Boolean),
    tiers: data.tiers.map((t, i) => ({ ...t, order: i + 1 })),
  };
}

function sortedTiers(data: RateCardData): RateCardData {
  return { ...data, tiers: [...data.tiers].sort((a, b) => a.order - b.order) };
}

function newTier(existing: RateCardTier[]): RateCardTier {
  const zero = { base: 0, withActivities: 0, withUnionCab: 0 };
  return {
    key: `tier-${Date.now().toString(36)}`,
    label: "New tier",
    order: existing.length + 1,
    hotels: [],
    packages: { b2b: { ...zero }, customer: { ...zero } },
    cost: { ...zero },
  };
}

export function RateCardEditor(props: RateCardEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [meta, setMeta] = useState<RateCardMeta>(props.meta);
  const [data, setData] = useState<RateCardData>(() => sortedTiers(props.data));
  const [changeNote, setChangeNote] = useState("");
  const [openTier, setOpenTier] = useState<string | null>(props.data.tiers[0]?.key ?? null);
  const [confirm, setConfirm] = useState<"activate" | { deleteTier: number } | null>(null);

  const initialJson = useMemo(() => JSON.stringify({ meta: props.meta, data: cleanForSave(props.data) }), [props.meta, props.data]);
  const dirty = JSON.stringify({ meta, data: cleanForSave(data) }) !== initialJson;
  const warnings = useMemo(() => getRateCardWarnings(data), [data]);
  const blockers = useMemo(() => getActivationBlockers(cleanForSave(data)), [data]);
  const locations = useMemo(
    () => [...new Set([...DEFAULT_LOCATIONS, ...data.tiers.flatMap((t) => t.hotels.map((h) => h.location))])].filter(Boolean),
    [data.tiers],
  );

  // Don't lose unsaved edits to an accidental tab close / reload.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const setBasis = (patch: Partial<RateCardData["basis"]>) => setData((d) => ({ ...d, basis: { ...d.basis, ...patch } }));
  const setTiers = (fn: (tiers: RateCardTier[]) => RateCardTier[]) => setData((d) => ({ ...d, tiers: fn(d.tiers) }));

  function save() {
    startTransition(async () => {
      const res = await fetch(`/api/rate-cards/${props.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: props.version,
          meta: { ...meta, notes: meta.notes?.trim() ? meta.notes : null },
          data: cleanForSave(data),
          changeNote: changeNote.trim() || null,
        }),
      });
      if (!res.ok) return void toast.error(await errorMessage(res, "Save failed."));
      toast.success(`Saved as version ${props.version + 1}.`);
      setChangeNote("");
      router.refresh();
    });
  }

  function activate() {
    setConfirm(null);
    startTransition(async () => {
      const res = await fetch(`/api/rate-cards/${props.id}/activate`, { method: "POST" });
      if (!res.ok) return void toast.error(await errorMessage(res, "Activation failed."));
      toast.success("This card is now active. Sales will see it.");
      router.refresh();
    });
  }

  function duplicate() {
    startTransition(async () => {
      const res = await fetch(`/api/rate-cards/${props.id}/duplicate`, { method: "POST" });
      if (!res.ok) return void toast.error(await errorMessage(res, "Duplicate failed."));
      const { id } = (await res.json()) as { id: string };
      toast.success("Copy created as a draft.");
      router.push(`/admin/rate-cards/${id}`);
    });
  }

  const basisMissing = (field: "nights" | "pax" | "activities" | "union") =>
    field === "nights"
      ? data.basis.nights < 1
      : field === "pax"
        ? data.basis.pax < 1
        : field === "activities"
          ? cleanForSave(data).activitiesIncluded.length === 0
          : cleanForSave(data).unionCabIncluded.length === 0;
  const requiredBadge = (missing: boolean) =>
    missing ? (
      <span className="rounded-md bg-red-500/15 px-1.5 py-0.5 text-[11px] font-bold text-red-600 dark:text-red-400">
        Required before activation
      </span>
    ) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/rate-cards/manage"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All rate cards
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-extrabold text-foreground">{meta.name || "Untitled card"}</h2>
            <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-bold", RATE_CARD_STATUS_STYLES[props.status])}>
              {props.status}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Version {props.version} · last saved {new Date(props.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            {props.updatedByName ? ` by ${props.updatedByName}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {props.canDuplicate ? (
            <button
              type="button"
              onClick={duplicate}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"
            >
              <Copy className="h-3.5 w-3.5" /> Duplicate card
            </button>
          ) : null}
          {props.status !== "ACTIVE" ? (
            <button
              type="button"
              onClick={() => setConfirm("activate")}
              disabled={isPending || dirty || blockers.length > 0}
              title={dirty ? "Save your changes first" : blockers.length > 0 ? "Fix the items listed below first" : undefined}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-500/10 disabled:opacity-40 dark:text-emerald-300"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Make active
            </button>
          ) : null}
        </div>
      </div>

      {/* Blockers + warnings */}
      {props.status !== "ACTIVE" && blockers.length > 0 ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-red-700 dark:text-red-300">
            <Ban className="h-4 w-4" /> Can&apos;t be made active yet
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[13px] text-red-700 dark:text-red-300">
            {blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {warnings.length > 0 ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" /> {warnings.length} warning{warnings.length === 1 ? "" : "s"} — saving still works
          </p>
          <ul className="mt-1.5 max-h-48 list-disc space-y-0.5 overflow-y-auto pl-5 text-[13px] text-amber-800 dark:text-amber-200">
            {warnings.map((w, i) => (
              <li key={i}>{w.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Section title="Card details">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelCls}>Name</label>
            <input value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Season label</label>
            <input
              value={meta.seasonLabel}
              onChange={(e) => setMeta({ ...meta, seasonLabel: e.target.value })}
              placeholder="NOV – FEB"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Valid from</label>
            <input
              type="date"
              value={meta.startDate}
              onChange={(e) => setMeta({ ...meta, startDate: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Valid until</label>
            <input
              type="date"
              value={meta.endDate}
              onChange={(e) => setMeta({ ...meta, endDate: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Internal notes</label>
          <textarea
            rows={2}
            value={meta.notes ?? ""}
            onChange={(e) => setMeta({ ...meta, notes: e.target.value })}
            className={inputCls}
          />
        </div>
      </Section>

      <Section
        title="Basis & inclusions"
        description="What every package price on this card covers. Shown to sales with each price."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <label className={cn(labelCls, "mb-0")}>Nights</label>
              {requiredBadge(basisMissing("nights"))}
            </div>
            <AmountInput value={data.basis.nights} onChange={(v) => setBasis({ nights: Math.min(v ?? 0, 30) })} />
          </div>
          <div>
            <label className={labelCls}>Days</label>
            <AmountInput value={data.basis.days} onChange={(v) => setBasis({ days: Math.min(v ?? 0, 31) })} />
          </div>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <label className={cn(labelCls, "mb-0")}>Pax the price covers</label>
              {requiredBadge(basisMissing("pax"))}
            </div>
            <AmountInput value={data.basis.pax} onChange={(v) => setBasis({ pax: Math.min(v ?? 0, 50) })} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Note for sales</label>
          <input
            value={data.basis.note ?? ""}
            onChange={(e) => setBasis({ note: e.target.value || undefined })}
            placeholder="Price is for the whole package, not per person"
            className={inputCls}
          />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <p className="text-xs font-bold text-foreground">“With activities” includes</p>
              {requiredBadge(basisMissing("activities"))}
            </div>
            <StringListEditor
              items={data.activitiesIncluded}
              onChange={(items) => setData((d) => ({ ...d, activitiesIncluded: items }))}
              placeholder="e.g. Gulmarg Gondola ride"
              addLabel="Add activity"
            />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <p className="text-xs font-bold text-foreground">“With union cab” covers</p>
              {requiredBadge(basisMissing("union"))}
            </div>
            <StringListEditor
              items={data.unionCabIncluded}
              onChange={(items) => setData((d) => ({ ...d, unionCabIncluded: items }))}
              placeholder="e.g. ABC Union Pahalgam"
              addLabel="Add union route"
            />
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-border p-3">
          <p className="text-xs font-bold text-foreground">
            Minimum profit <span className="ml-1 font-medium text-muted-foreground">internal — never shown to sales</span>
          </p>
          <div className="mt-2 grid max-w-md gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>B2B, per package</label>
              <AmountInput
                value={data.minProfit.b2b}
                onChange={(v) => setData((d) => ({ ...d, minProfit: { ...d.minProfit, b2b: v ?? 0 } }))}
              />
            </div>
            <div>
              <label className={labelCls}>Customer, per package</label>
              <AmountInput
                value={data.minProfit.customer}
                onChange={(v) => setData((d) => ({ ...d, minProfit: { ...d.minProfit, customer: v ?? 0 } }))}
              />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Tiers" description="Hotels and package prices per category. Enter each tier's cost to check profit.">
        <div className="space-y-3">
          {data.tiers.map((tier, i) => (
            <TierEditor
              key={tier.key}
              tier={tier}
              index={i}
              count={data.tiers.length}
              minProfit={data.minProfit}
              warningCount={warnings.filter((w) => w.tierKey === tier.key).length}
              open={openTier === tier.key}
              onToggle={() => setOpenTier((k) => (k === tier.key ? null : tier.key))}
              onChange={(t) => setTiers((tiers) => replaceAt(tiers, i, t))}
              onMove={(d) => setTiers((tiers) => moveItem(tiers, i, d))}
              onDelete={() => setConfirm({ deleteTier: i })}
            />
          ))}
        </div>
        <AddRowButton
          onClick={() => {
            const tier = newTier(data.tiers);
            setTiers((tiers) => [...tiers, tier]);
            setOpenTier(tier.key);
          }}
        >
          Add tier
        </AddRowButton>
        <datalist id={LOCATIONS_LIST_ID}>
          {locations.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </Section>

      <Section title="Union cabs" description="Leave a vehicle blank where it isn't offered on that route.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-[12px] text-muted-foreground">
                <th className="py-1.5 pr-1 text-left font-semibold">Route</th>
                {UNION_CAB_VEHICLES.map((v) => (
                  <th key={v.key} className="px-1 py-1.5 text-right font-semibold">
                    {v.label}
                  </th>
                ))}
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {data.unionCabs.map((cab, i) => (
                <tr key={i}>
                  <td className="py-1 pr-1">
                    <input
                      value={cab.route}
                      aria-label="Route"
                      onChange={(e) =>
                        setData((d) => ({ ...d, unionCabs: replaceAt(d.unionCabs, i, { ...cab, route: e.target.value }) }))
                      }
                      className={cellCls}
                    />
                  </td>
                  {UNION_CAB_VEHICLES.map((v) => (
                    <td key={v.key} className="w-28 px-1 py-1">
                      <AmountInput
                        nullable
                        ariaLabel={v.label}
                        value={cab.rates[v.key]}
                        onChange={(value) => {
                          const rates = { ...cab.rates };
                          if (value == null) delete rates[v.key];
                          else rates[v.key] = value;
                          setData((d) => ({ ...d, unionCabs: replaceAt(d.unionCabs, i, { ...cab, rates }) }));
                        }}
                      />
                    </td>
                  ))}
                  <td className="py-1 pl-1">
                    <RowActions
                      index={i}
                      count={data.unionCabs.length}
                      label="route"
                      onMove={(dl) => setData((d) => ({ ...d, unionCabs: moveItem(d.unionCabs, i, dl) }))}
                      onDelete={() => setData((d) => ({ ...d, unionCabs: d.unionCabs.filter((_, j) => j !== i) }))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AddRowButton onClick={() => setData((d) => ({ ...d, unionCabs: [...d.unionCabs, { route: "", rates: {} }] }))}>
          Add route
        </AddRowButton>
      </Section>

      <Section title="Vehicles" description="Per-day rates.">
        <div className="max-w-lg space-y-2">
          {data.vehicles.map((vehicle, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={vehicle.name}
                aria-label="Vehicle"
                onChange={(e) =>
                  setData((d) => ({ ...d, vehicles: replaceAt(d.vehicles, i, { ...vehicle, name: e.target.value }) }))
                }
                className={cellCls}
              />
              <AmountInput
                className="w-32 shrink-0"
                ariaLabel="Price per day"
                value={vehicle.price}
                onChange={(v) =>
                  setData((d) => ({ ...d, vehicles: replaceAt(d.vehicles, i, { ...vehicle, price: v ?? 0 }) }))
                }
              />
              <RowActions
                index={i}
                count={data.vehicles.length}
                label="vehicle"
                onMove={(dl) => setData((d) => ({ ...d, vehicles: moveItem(d.vehicles, i, dl) }))}
                onDelete={() => setData((d) => ({ ...d, vehicles: d.vehicles.filter((_, j) => j !== i) }))}
              />
            </div>
          ))}
          <AddRowButton onClick={() => setData((d) => ({ ...d, vehicles: [...d.vehicles, { name: "", price: 0 }] }))}>
            Add vehicle
          </AddRowButton>
        </div>
      </Section>

      <RevisionsPanel cardId={props.id} currentVersion={props.version} hasUnsavedChanges={dirty} />

      {/* Sticky save bar */}
      {/* Sticky inside the admin <main> scroller; clears the mobile tab bar. */}
      <div className="sticky bottom-[4.5rem] z-30 rounded-2xl border border-border bg-card/95 shadow-lg backdrop-blur lg:bottom-0">
        <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
          <input
            value={changeNote}
            onChange={(e) => setChangeNote(e.target.value)}
            maxLength={300}
            placeholder="Change note (optional) — e.g. Updated Gulmarg hotel rates"
            className={cn(inputCls, "sm:flex-1")}
          />
          <div className="flex items-center gap-2">
            {dirty ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setMeta(props.meta);
                  setData(sortedTiers(props.data));
                  setChangeNote("");
                }}
                className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"
              >
                Discard
              </button>
            ) : null}
            <button
              type="button"
              onClick={save}
              disabled={isPending || !dirty}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:brightness-110 disabled:opacity-50 sm:flex-none"
            >
              <Save className="h-3.5 w-3.5" /> {dirty ? "Save new version" : "No changes"}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === "activate"}
        title={`Make “${meta.name}” the active card?`}
        description="Sales will see this card from now on. The card that is active now (if any) will be archived."
        confirmLabel="Make active"
        onConfirm={activate}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={typeof confirm === "object" && confirm !== null}
        destructive
        title={`Delete tier “${typeof confirm === "object" && confirm ? data.tiers[confirm.deleteTier]?.label : ""}”?`}
        description="Its hotels and prices are removed from this card when you save. Earlier versions stay in history."
        confirmLabel="Delete tier"
        onConfirm={() => {
          if (typeof confirm === "object" && confirm) {
            const index = confirm.deleteTier;
            setTiers((tiers) => tiers.filter((_, j) => j !== index));
          }
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
