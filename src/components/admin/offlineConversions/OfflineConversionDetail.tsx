"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, RotateCw, CheckCircle2, XCircle, Clock, RefreshCcw, PlusCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/admin/offlineConversions/CopyButton";
import { JsonView } from "@/components/admin/offlineConversions/JsonView";
import { PlatformBadge } from "@/components/admin/offlineConversions/PlatformBadge";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  deriveEventName,
  classifyFailure,
  extractRequestId,
  extractHttpStatus,
  isRetryable,
  timeAgo,
} from "@/lib/admin/offlineConversions";

type Platform = "GOOGLE" | "META" | "MICROSOFT";
type Status = "PENDING" | "SENT" | "FAILED";
type Tab = "summary" | "request" | "response" | "timeline" | "json";

interface Attribution {
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  landingPage: string | null;
  referrer: string | null;
}

interface RowLead extends Attribution {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  negotiatedAmount: number | null;
  source: string;
  status: string;
}

interface RowBooking extends Attribution {
  id: string;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string;
  amount: number;
  currency: string;
  status: string;
}

interface Row {
  id: string;
  leadId: string | null;
  bookingId: string | null;
  platform: Platform;
  status: Status;
  attempts: number;
  lastError: string | null;
  platformResponse: string | null;
  sentAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  lead: RowLead | null;
  booking: RowBooking | null;
}

interface Props {
  row: Row;
  canRetry: boolean;
  destinationId: string | null;
}

function fmtDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, mono, copy }: { label: string; value: React.ReactNode; mono?: boolean; copy?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="flex items-center gap-1.5 text-right">
        <span className={cn("text-foreground font-medium break-all", mono && "font-mono")}>{value ?? "—"}</span>
        {copy && <CopyButton value={copy} label={label} />}
      </span>
    </div>
  );
}

const TABS: { key: Tab; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "request", label: "Request" },
  { key: "response", label: "Response" },
  { key: "timeline", label: "Timeline" },
  { key: "json", label: "JSON" },
];

export function OfflineConversionDetail({ row, canRetry, destinationId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [retrying, setRetrying] = useState(false);
  const [checking, setChecking] = useState(false);
  const [tab, setTab] = useState<Tab>("summary");

  const eventName = deriveEventName(row);
  const requestId = extractRequestId(row.platformResponse);
  const httpStatus = extractHttpStatus(row.lastError);
  const failure = classifyFailure(row.platform, row.lastError);
  const attribution = row.lead ?? row.booking;
  const gclid = attribution?.gclid ?? null;

  async function retry() {
    setRetrying(true);
    try {
      const res = await fetch(`/api/offline-conversions/${row.id}/retry`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error);
      if (json.outcome === "sent") toast.success("Retried — sent successfully.");
      else toast.error("Retried — still failed. See error details below.");
      startTransition(() => router.refresh());
    } catch {
      toast.error("Retry failed to run.");
    } finally {
      setRetrying(false);
    }
  }

  async function checkStatus() {
    setChecking(true);
    try {
      const res = await fetch(`/api/offline-conversions/${row.id}/check-status`, { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (json.ok) toast.success(json.message ?? "Checked.", { duration: 8000 });
      else toast.error(json.message ?? "Could not check status.", { duration: 8000 });
    } catch {
      toast.error("Status check failed to run.");
    } finally {
      setChecking(false);
    }
  }

  // Best-effort timeline reconstructed from the fields we actually persist —
  // there is no separate per-attempt history table (no schema change was made
  // for this module), so individual "Attempt #2 at <time>"-style entries
  // aren't available; this shows the attempt count against the one timestamp
  // we do have (the most recent update), rather than fabricate timestamps.
  const timeline: { label: string; timestamp: string; icon: React.ComponentType<{ className?: string }>; tone: string }[] = [
    { label: "Created & queued", timestamp: fmtDate(row.createdAt), icon: PlusCircle, tone: "text-muted-foreground" },
  ];
  for (let i = 1; i <= row.attempts; i++) {
    const isLast = i === row.attempts;
    timeline.push({
      label: `Attempt #${i}`,
      // Only the most recent attempt's timestamp is actually stored — earlier
      // attempts are known to have happened but not when, exactly.
      timestamp: isLast ? fmtDate(row.updatedAt) : "(timestamp not recorded)",
      icon: RefreshCcw,
      tone: "text-blue-500",
    });
  }
  if (row.status === "FAILED") {
    timeline.push({ label: `Failed — ${failure.title}`, timestamp: fmtDate(row.updatedAt), icon: XCircle, tone: "text-red-500" });
  }
  if (row.status === "SENT") {
    timeline.push({ label: "Succeeded", timestamp: fmtDate(row.sentAt), icon: CheckCircle2, tone: "text-green-500" });
  }
  if (row.status === "PENDING" && row.attempts === 0) {
    timeline.push({ label: "Awaiting first attempt", timestamp: "—", icon: Clock, tone: "text-amber-500" });
  }

  const requestDataGroups = attribution
    ? {
        Customer: row.lead ? { Name: row.lead.name, Email: row.lead.email, Phone: row.lead.phone } : { Name: row.booking?.guestName, Email: row.booking?.guestEmail, Phone: row.booking?.guestPhone },
        ...(row.booking ? { Booking: { Amount: row.booking.amount, Currency: row.booking.currency } } : {}),
        Conversion: {
          value: row.lead ? row.lead.negotiatedAmount : row.booking?.amount,
          currency: row.booking?.currency ?? "INR",
          dedupeKey: row.id,
        },
        Attribution: {
          gclid: attribution.gclid,
          gbraid: attribution.gbraid,
          wbraid: attribution.wbraid,
          fbclid: attribution.fbclid,
          msclkid: attribution.msclkid,
          utmSource: attribution.utmSource,
          utmMedium: attribution.utmMedium,
          utmCampaign: attribution.utmCampaign,
          landingPage: attribution.landingPage,
          referrer: attribution.referrer,
        },
        Platform: { platform: row.platform, destinationId },
      }
    : null;

  return (
    <div className="space-y-5 max-w-10xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/offline-conversions"
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="font-display font-extrabold text-foreground text-lg">{eventName}</h2>
            <p className="text-muted-foreground text-xs mt-0.5 font-mono flex items-center gap-1.5">
              {row.id} <CopyButton value={row.id} label="Row ID" />
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {row.platform === "GOOGLE" && requestId && (
            <button
              type="button"
              onClick={checkStatus}
              disabled={checking}
              className="flex items-center gap-1.5 border border-border text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors hover:bg-muted disabled:opacity-60"
            >
              <Search className={cn("w-3.5 h-3.5", checking && "animate-pulse")} /> Check Status
            </button>
          )}
          {canRetry && isRetryable(row.status) && (
            <button
              type="button"
              onClick={retry}
              disabled={retrying}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-primary/25 disabled:opacity-60"
            >
              <RotateCw className={cn("w-3.5 h-3.5", retrying && "animate-spin")} /> Retry
            </button>
          )}
        </div>
      </div>

      {/* Quick Health Panel */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3.5">Health Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[12px] text-muted-foreground mb-1">Platform</p>
            <PlatformBadge platform={row.platform} />
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground mb-1">Status</p>
            <span className={cn("text-[12px] font-bold px-2 py-0.5 rounded-full", STATUS_STYLES[row.status])}>{STATUS_LABELS[row.status]}</span>
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground mb-1">Failure Type</p>
            <p className="text-xs font-bold text-foreground">{row.status === "FAILED" ? failure.title : "—"}</p>
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground mb-1">Retryable</p>
            <p className={cn("text-xs font-bold", isRetryable(row.status) ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
              {isRetryable(row.status) ? "YES" : "NO"}
            </p>
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground mb-1">Attempts</p>
            <p className="text-xs font-bold text-foreground">{row.attempts}</p>
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground mb-1">Last Attempt</p>
            <p className="text-xs font-bold text-foreground" title={fmtDate(row.updatedAt)}>
              {row.attempts > 0 ? timeAgo(row.updatedAt) : "—"}
            </p>
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground mb-1">Event</p>
            <p className="text-xs font-bold text-foreground">{eventName}</p>
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground mb-1">GCLID</p>
            <span className="flex items-center gap-1">
              <span className="text-xs font-mono font-bold text-foreground truncate max-w-[100px]">{gclid ?? "—"}</span>
              {gclid && <CopyButton value={gclid} label="GCLID" />}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3.5 py-2 text-xs font-bold border-b-2 -mb-px transition-colors",
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Section title="General">
              <Field label="Lead" value={row.lead ? <Link href={`/admin/leads/${row.lead.id}`} className="text-primary hover:underline">{row.lead.name}</Link> : "—"} />
              <Field label="Booking" value={row.booking ? <Link href={`/admin/bookings/${row.booking.id}`} className="text-primary hover:underline">{row.booking.guestName}</Link> : "—"} />
              <Field label="Platform" value={<PlatformBadge platform={row.platform} />} />
              <Field label="Status" value={<span className={cn("text-[12px] font-bold px-2 py-0.5 rounded-full", STATUS_STYLES[row.status])}>{STATUS_LABELS[row.status]}</span>} />
              <Field label="Attempts" value={row.attempts} />
              <Field label="Created" value={fmtDate(row.createdAt)} />
              <Field label="Updated" value={fmtDate(row.updatedAt)} />
            </Section>

            <Section title="Processing">
              <Field label="Last Attempt" value={row.attempts > 0 ? fmtDate(row.updatedAt) : "—"} />
              <Field label="Last Success" value={fmtDate(row.sentAt)} />
              <Field label="Destination ID" value={destinationId} mono copy={destinationId} />
              <Field label="Request ID" value={requestId} mono copy={requestId} />
              <Field label="HTTP Status" value={httpStatus} mono />
              {row.lastError && <Field label="Error Type" value={failure.title} />}
            </Section>
          </div>

          {row.lastError && (
            <Section title="Last Error" right={<CopyButton value={row.lastError} label="Last Error" />}>
              <p className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-words font-mono bg-red-500/5 rounded-xl p-3 border border-red-500/10">
                {row.lastError}
              </p>
            </Section>
          )}

          {/* Collapsible advanced debug — native <details>, no new dependency */}
          <details className="bg-card rounded-2xl border border-border shadow-sm p-5 group">
            <summary className="text-xs font-bold uppercase tracking-wide text-muted-foreground cursor-pointer select-none list-none flex items-center justify-between">
              Advanced Debug
              <span className="text-[12px] font-normal normal-case text-muted-foreground/70 group-open:hidden">click to expand</span>
            </summary>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-[12px] font-semibold text-muted-foreground mb-1.5 flex items-center justify-between">
                  Raw Row JSON <CopyButton value={JSON.stringify(row, null, 2)} label="Raw JSON" />
                </p>
                <JsonView value={row} />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-muted-foreground mb-1.5 flex items-center justify-between">
                  Platform Response {row.platformResponse && <CopyButton value={row.platformResponse} label="Platform Response" />}
                </p>
                {row.platformResponse ? <JsonView value={row.platformResponse} /> : <p className="text-xs text-muted-foreground">No response captured.</p>}
              </div>
              <div>
                <p className="text-[12px] font-semibold text-muted-foreground mb-1.5">Stack Trace</p>
                <p className="text-xs text-muted-foreground">Not captured — adapters only persist the platform's error message, not a stack trace.</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-muted-foreground mb-1.5">Headers</p>
                <p className="text-xs text-muted-foreground">Not currently captured (reserved for a future enhancement).</p>
              </div>
            </div>
          </details>
        </div>
      )}

      {tab === "request" && (
        <Section
          title="Request Data (reconstructed from source attribution)"
          right={requestDataGroups ? <CopyButton value={JSON.stringify(requestDataGroups, null, 2)} label="Request Data JSON" /> : undefined}
        >
          {requestDataGroups ? (
            <div className="space-y-4">
              {Object.entries(requestDataGroups).map(([group, fields]) => (
                <div key={group}>
                  <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">{group}</p>
                  <JsonView value={fields} />
                </div>
              ))}
              <p className="text-[12px] text-muted-foreground italic">
                This is reconstructed from the source Lead/Booking's current attribution data — the exact historical wire payload isn't persisted.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Originating Lead/Booking no longer exists.</p>
          )}
        </Section>
      )}

      {tab === "response" && (
        <div className="space-y-5">
          <Section title="Platform Response" right={row.platformResponse && <CopyButton value={row.platformResponse} label="Platform Response" />}>
            {row.platformResponse ? (
              <JsonView value={row.platformResponse} className="max-h-96" />
            ) : (
              <p className="text-xs text-muted-foreground">No response captured{row.status === "FAILED" ? " — see Last Error." : "."}</p>
            )}
          </Section>
          {row.lastError && (
            <Section title="Last Error" right={<CopyButton value={row.lastError} label="Last Error" />}>
              <p className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-words font-mono bg-red-500/5 rounded-xl p-3 border border-red-500/10">
                {row.lastError}
              </p>
            </Section>
          )}
        </div>
      )}

      {tab === "timeline" && (
        <Section title="Timeline">
          <div className="space-y-3">
            {timeline.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <t.icon className={cn("w-4 h-4 shrink-0", t.tone)} />
                <span className="text-xs font-semibold text-foreground flex-1">{t.label}</span>
                <span className="text-[12px] text-muted-foreground">{t.timestamp}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {tab === "json" && (
        <Section title="Raw JSON" right={<CopyButton value={JSON.stringify(row, null, 2)} label="Raw JSON" />}>
          <JsonView value={row} className="max-h-[32rem]" />
        </Section>
      )}
    </div>
  );
}
