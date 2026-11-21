"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Paperclip, Search, Tag } from "lucide-react";
import { EmailB2bAgentsDialog } from "./EmailB2bAgentsDialog";

export interface CommAgent {
  id: string;
  label: string;
  contact: string | null;
  email: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  joinedAt: string;
  requests: number;
  lastRequestAt: string | null;
  bookings: number;
}

export interface CommMessage {
  id: string;
  subject: string;
  message: string;
  attachmentName: string | null;
  recipients: string[];
  sent: number;
  failed: number;
  sentByName: string;
  createdAt: string;
  request: { id: string; name: string } | null;
}

const QUIET_DAYS = 60;
const FILTERS = [
  { key: "active", label: "Active" },
  { key: "noBookings", label: "Active, no bookings" },
  { key: "quiet", label: `No requests in ${QUIET_DAYS} days` },
  { key: "all", label: "All agents" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const STATUS_STYLE: Record<CommAgent["status"], string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  SUSPENDED: "bg-red-500/15 text-red-700 dark:text-red-300",
};

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

function matches(a: CommAgent, f: FilterKey): boolean {
  if (f === "all") return true;
  if (a.status !== "ACTIVE") return false;
  if (f === "noBookings") return a.bookings === 0;
  if (f === "quiet") {
    const since = Date.now() - QUIET_DAYS * 86_400_000;
    const last = a.lastRequestAt ?? a.joinedAt;
    return new Date(last).getTime() < since;
  }
  return true;
}

/** Admin → B2B Communication: pick agents (all / filtered / ticked), email
 *  them with an optional attachment, and see what was sent before. */
export function B2bCommunicationClient({
  agents,
  messages,
  canSend,
}: {
  agents: CommAgent[];
  messages: CommMessage[];
  canSend: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("active");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return agents.filter(
      (a) =>
        matches(a, filter) &&
        (!term || `${a.label} ${a.contact ?? ""} ${a.email}`.toLowerCase().includes(term)),
    );
  }, [agents, filter, q]);

  const allVisibleTicked = visible.length > 0 && visible.every((a) => selected.has(a.id));
  const activeCount = agents.filter((a) => a.status === "ACTIVE").length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const a of visible) {
        if (allVisibleTicked) next.delete(a.id);
        else next.add(a.id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">B2B Communication</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Email offers, updates and reminders to all or selected partners. To follow up on one request,
            use <span className="font-semibold">Follow up</span> on that B2B request.
          </p>
        </div>
        {canSend && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
          >
            <Mail className="h-4 w-4" />
            {selected.size > 0 ? `Email ${selected.size} selected` : "Email all active agents"}
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label} ({agents.filter((a) => matches(a, f.key)).length})
            </button>
          ))}
          <label className="relative ml-auto w-full sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search agency, name, email"
              className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 max-md:text-[16px]"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 text-xs text-muted-foreground">
          <label className="flex items-center gap-2 font-semibold">
            <input type="checkbox" checked={allVisibleTicked} onChange={toggleVisible} disabled={!visible.length} />
            Select all shown ({visible.length})
          </label>
          {selected.size > 0 && (
            <button type="button" onClick={() => setSelected(new Set())} className="font-semibold hover:text-foreground">
              Clear selection ({selected.size})
            </button>
          )}
        </div>

        <ul className="max-h-[420px] divide-y divide-border overflow-y-auto">
          {visible.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No agents match this filter.</li>
          )}
          {visible.map((a) => (
            <li key={a.id}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/50">
                <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggle(a.id)} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">{a.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[a.status]}`}>
                      {a.status}
                    </span>
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[a.contact, a.email].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
                  <span className="block">
                    {a.requests} request{a.requests === 1 ? "" : "s"} · {a.bookings} booking
                    {a.bookings === 1 ? "" : "s"}
                  </span>
                  <span className="block">Last request {fmt(a.lastRequestAt)}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <h2 className="border-b border-border px-4 py-3 text-sm font-bold text-foreground">Sent messages</h2>
        {messages.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nothing sent yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {messages.map((m) => (
              <li key={m.id} className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                  className="w-full text-left"
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">{m.subject}</span>
                    <span className="text-xs text-muted-foreground">{fmt(m.createdAt)}</span>
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      To {m.recipients.length === 1 ? m.recipients[0] : `${m.recipients.length} agents`}
                    </span>
                    <span>
                      {m.sent} sent{m.failed ? ` · ${m.failed} failed` : ""}
                    </span>
                    <span>By {m.sentByName}</span>
                    {m.attachmentName && (
                      <span className="inline-flex items-center gap-1">
                        <Paperclip className="h-3 w-3" /> {m.attachmentName}
                      </span>
                    )}
                  </span>
                </button>
                {m.request && (
                  <Link
                    href={`/admin/b2b-requests/${m.request.id}`}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <Tag className="h-3 w-3" /> {m.request.name}
                  </Link>
                )}
                {expanded === m.id && (
                  <div className="mt-2 space-y-2 rounded-xl bg-muted/50 p-3 text-sm">
                    <p className="whitespace-pre-wrap text-foreground">{m.message}</p>
                    {m.recipients.length > 1 && (
                      <p className="text-xs text-muted-foreground">Recipients: {m.recipients.join(", ")}</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {canSend && (
        <EmailB2bAgentsDialog
          open={open}
          onOpenChange={setOpen}
          selected={agents.filter((a) => selected.has(a.id)).map((a) => ({ id: a.id, label: a.label }))}
          activeCount={activeCount}
          onSent={() => {
            setSelected(new Set());
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
