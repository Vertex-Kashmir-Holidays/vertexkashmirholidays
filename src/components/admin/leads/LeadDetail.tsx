"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Trash2,
  Clock,
  User,
  ArrowRight,
  MessageSquare,
  Phone,
  Mail,
  Paperclip,
  ChevronDown,
  Loader2,
  Link2,
  type LucideIcon,
} from "lucide-react";

type LeadStatus = "NEW" | "CONNECTED" | "NOT_CONNECTED" | "QUALIFIED" | "NEGOTIATION" | "ON_HOLD" | "CONVERTED" | "REJECTED";
type LeadSource = "WEBSITE" | "MANUAL" | "GOOGLE_ADS" | "META_ADS" | "THIRD_PARTY" | "REFERRAL";
type LeadCategory = "HONEYMOON_TOUR" | "COUPLE" | "FAMILY_TOUR" | "GROUP_TOUR" | "SKI_TOUR" | "OFFBEAT_TOUR";
type LeadActivityType =
  | "STATUS_CHANGE"
  | "ASSIGNMENT_CHANGE"
  | "NOTE_ADDED"
  | "FOLLOW_UP_SCHEDULED"
  | "ATTACHMENT_ADDED"
  | "CALL_LOGGED"
  | "EMAIL_SENT"
  | "BOOKING_LINKED";

interface Activity {
  id: string;
  type: LeadActivityType;
  note: string | null;
  fromStatus: LeadStatus | null;
  toStatus: LeadStatus | null;
  fromAssigneeId: string | null;
  toAssigneeId: string | null;
  performedByName: string;
  performedAt: Date | string;
}

interface LinkedBooking {
  id: string;
  status: string;
  amount: number;
  travelDate: Date | string;
  guestName: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: LeadSource;
  category: LeadCategory | null;
  adults: number;
  children: number | null;
  startDate: Date | string | null;
  endDate: Date | string | null;
  notes: string | null;
  followUpAt: Date | string | null;
  status: LeadStatus;
  bookingId: string | null;
  booking: LinkedBooking | null;
  assignedToId: string | null;
  assignedTo: { id: string; name: string | null } | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  activities: Activity[];
}

interface StaffUser {
  id: string;
  name: string | null;
}

interface Props {
  lead: Lead;
  staffUsers: StaffUser[];
}

const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-brand-cyan/10 text-brand-cyan",
  CONNECTED: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  NOT_CONNECTED: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  QUALIFIED: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  NEGOTIATION: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  ON_HOLD: "bg-muted text-muted-foreground",
  CONVERTED: "bg-green-500/15 text-green-700 dark:text-green-300",
  REJECTED: "bg-red-500/15 text-red-700 dark:text-red-300",
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  PAID: "bg-green-500/15 text-green-700 dark:text-green-300",
  FAILED: "bg-red-500/15 text-red-700 dark:text-red-300",
  CANCELLED: "bg-muted text-muted-foreground",
  REFUNDED: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
};

const ACTIVITY_ICONS: Record<LeadActivityType, LucideIcon> = {
  STATUS_CHANGE: ArrowRight,
  ASSIGNMENT_CHANGE: User,
  NOTE_ADDED: MessageSquare,
  FOLLOW_UP_SCHEDULED: Clock,
  CALL_LOGGED: Phone,
  EMAIL_SENT: Mail,
  ATTACHMENT_ADDED: Paperclip,
  BOOKING_LINKED: Link2,
};

function fmtSource(s: LeadSource) {
  return s.toLowerCase().replace(/_/g, " ");
}

function fmtCategory(c: LeadCategory | null) {
  if (!c) return "—";
  return c.toLowerCase().replace(/_/g, " ");
}

function fmtDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(d: Date | string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function activityLabel(a: Activity): string {
  switch (a.type) {
    case "STATUS_CHANGE":
      return `Status: ${a.fromStatus?.replace(/_/g, " ")} → ${a.toStatus?.replace(/_/g, " ")}`;
    case "ASSIGNMENT_CHANGE":
      return a.toAssigneeId ? "Lead assigned" : "Lead unassigned";
    case "NOTE_ADDED":
      return "Note added";
    case "FOLLOW_UP_SCHEDULED":
      return "Follow-up scheduled";
    case "CALL_LOGGED":
      return "Call logged";
    case "EMAIL_SENT":
      return "Email sent";
    case "ATTACHMENT_ADDED":
      return "Attachment added";
    case "BOOKING_LINKED":
      return a.note?.startsWith("Linked") ? "Booking linked" : "Booking unlinked";
  }
}

const selectCls =
  "w-full pl-3 pr-8 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-card appearance-none disabled:opacity-60";

export function LeadDetail({ lead, staffUsers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [assignedToId, setAssignedToId] = useState(lead.assignedToId ?? "");
  const [category, setCategory] = useState(lead.category ?? "");
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [followUpAt, setFollowUpAt] = useState(
    lead.followUpAt ? new Date(lead.followUpAt).toISOString().slice(0, 16) : "",
  );
  const [bookingInput, setBookingInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync local state when RSC re-delivers fresh props after router.refresh().
  useEffect(() => {
    setStatus(lead.status);
    setAssignedToId(lead.assignedToId ?? "");
    setCategory(lead.category ?? "");
    setNotes(lead.notes ?? "");
    setFollowUpAt(lead.followUpAt ? new Date(lead.followUpAt).toISOString().slice(0, 16) : "");
  }, [lead.status, lead.assignedToId, lead.category, lead.notes, lead.followUpAt]);

  // Clear the booking input when a booking is unlinked.
  useEffect(() => {
    if (!lead.booking) setBookingInput("");
  }, [lead.booking]);

  function patch(payload: Record<string, unknown>) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/leads/${lead.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const j = (await res.json()) as { error?: string | Record<string, unknown> };
          const msg = typeof j.error === "string" ? j.error : "Update failed.";
          toast.error(msg);
          return;
        }
        toast.success("Saved.");
        router.refresh();
      } catch {
        toast.error("An error occurred.");
      }
    });
  }

  function handleStatusChange(val: LeadStatus) {
    if (val === "CONVERTED" && !lead.booking) {
      toast.error("CONVERTED requires a linked booking.");
      setStatus(lead.status);
      return;
    }
    setStatus(val);
    patch({ status: val });
  }

  function handleAssignChange(val: string) {
    setAssignedToId(val);
    patch({ assignedToId: val || null });
  }

  function handleCategoryChange(val: string) {
    setCategory(val);
    patch({ category: val || null });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        toast.success("Lead deleted.");
        router.push("/admin/leads");
        router.refresh();
      } catch {
        toast.error("Failed to delete lead.");
      }
    });
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">{lead.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", STATUS_STYLES[status])}>
              {status.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-muted-foreground">Added {fmtDate(lead.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {confirmDelete ? (
            <>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 px-3 py-2 rounded-xl transition-colors"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Confirm Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl border border-border transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-xl border border-border transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* LEFT: details + notes + activity */}
        <div className="space-y-5">
          {/* Lead info grid */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h3 className="font-bold text-foreground text-sm mb-4">Lead Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5">Phone</p>
                <a href={`tel:${lead.phone}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                  {lead.phone}
                </a>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Email</p>
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className="font-semibold text-foreground hover:text-primary transition-colors truncate block max-w-full">
                    {lead.email}
                  </a>
                ) : (
                  <p className="font-semibold text-foreground">—</p>
                )}
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Source</p>
                <p className="font-semibold text-foreground capitalize">{fmtSource(lead.source)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Category</p>
                <p className="font-semibold text-foreground capitalize">{fmtCategory(lead.category)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Adults</p>
                <p className="font-semibold text-foreground">{lead.adults}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Children</p>
                <p className="font-semibold text-foreground">{lead.children ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Travel Start</p>
                <p className="font-semibold text-foreground">{fmtDate(lead.startDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Travel End</p>
                <p className="font-semibold text-foreground">{fmtDate(lead.endDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Assigned To</p>
                <p className="font-semibold text-foreground">{lead.assignedTo?.name ?? "—"}</p>
              </div>
              {lead.booking && (
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-muted-foreground mb-0.5">Linked Booking</p>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/admin/bookings"
                      className="font-mono text-[10px] text-primary hover:underline"
                    >
                      {lead.booking.id}
                    </Link>
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      BOOKING_STATUS_STYLES[lead.booking.status] ?? "bg-muted text-muted-foreground",
                    )}>
                      {lead.booking.status}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <p className="text-muted-foreground mb-0.5">Follow-up</p>
                {lead.followUpAt ? (
                  <p className={cn(
                    "font-semibold",
                    new Date(lead.followUpAt) < new Date()
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-foreground",
                  )}>
                    {fmtDate(lead.followUpAt)}
                  </p>
                ) : (
                  <p className="font-semibold text-foreground">—</p>
                )}
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Last Updated</p>
                <p className="font-semibold text-foreground">{fmtDate(lead.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h3 className="font-bold text-foreground text-sm mb-3">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition resize-none"
              placeholder="Add notes about this lead..."
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => patch({ notes })}
                disabled={isPending || notes === (lead.notes ?? "")}
                className="flex items-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Notes
              </button>
            </div>
          </div>

          {/* Activity timeline */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h3 className="font-bold text-foreground text-sm mb-4">
              Activity{lead.activities.length > 0 && ` (${lead.activities.length})`}
            </h3>
            {lead.activities.length === 0 ? (
              <p className="text-muted-foreground text-xs py-4 text-center">No activity recorded yet.</p>
            ) : (
              <ol className="space-y-3">
                {lead.activities.map((a) => {
                  const Icon = ACTIVITY_ICONS[a.type];
                  return (
                    <li key={a.id} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 pb-3 border-b border-border last:border-0 last:pb-0">
                        <p className="text-xs font-semibold text-foreground">{activityLabel(a)}</p>
                        {a.note && <p className="text-[10px] text-muted-foreground mt-0.5">{a.note}</p>}
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          by {a.performedByName} · {fmtDateTime(a.performedAt)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        {/* RIGHT: quick-edit panel */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm">Update Lead</h3>
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                  disabled={isPending}
                  className={selectCls}
                >
                  <option value="NEW">New</option>
                  <option value="CONNECTED">Connected</option>
                  <option value="NOT_CONNECTED">Not Connected</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="NEGOTIATION">Negotiation</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="CONVERTED" disabled={!lead.booking}>
                    Converted{!lead.booking ? " (requires booking)" : ""}
                  </option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Assigned To</label>
              <div className="relative">
                <select
                  value={assignedToId}
                  onChange={(e) => handleAssignChange(e.target.value)}
                  disabled={isPending}
                  className={selectCls}
                >
                  <option value="">Unassigned</option>
                  {staffUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ?? u.id}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Category</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  disabled={isPending}
                  className={selectCls}
                >
                  <option value="">— Select —</option>
                  <option value="HONEYMOON_TOUR">Honeymoon</option>
                  <option value="COUPLE">Couple</option>
                  <option value="FAMILY_TOUR">Family</option>
                  <option value="GROUP_TOUR">Group</option>
                  <option value="SKI_TOUR">Ski</option>
                  <option value="OFFBEAT_TOUR">Offbeat</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Follow-up */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm">Follow-up</h3>
              {lead.followUpAt && (
                <button
                  onClick={() => { setFollowUpAt(""); patch({ followUpAt: null }); }}
                  disabled={isPending}
                  className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              type="datetime-local"
              value={followUpAt}
              onChange={(e) => setFollowUpAt(e.target.value)}
              disabled={isPending}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-card disabled:opacity-60"
            />
            <button
              onClick={() => patch({ followUpAt: followUpAt || null })}
              disabled={isPending || followUpAt === (lead.followUpAt ? new Date(lead.followUpAt).toISOString().slice(0, 16) : "")}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {followUpAt ? "Set Follow-up" : "Clear Follow-up"}
            </button>
          </div>

          {/* Linked Booking */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm">Linked Booking</h3>
              {lead.booking && (
                <button
                  onClick={() => patch({ bookingId: null })}
                  disabled={isPending}
                  className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors"
                >
                  Unlink
                </button>
              )}
            </div>

            {lead.booking ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    ...{lead.booking.id.slice(-8)}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    BOOKING_STATUS_STYLES[lead.booking.status] ?? "bg-muted text-muted-foreground",
                  )}>
                    {lead.booking.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-foreground">{lead.booking.guestName}</p>
                <p className="text-[10px] text-muted-foreground">
                  {fmtDate(lead.booking.travelDate)}
                  {" · "}
                  <span className="font-semibold text-foreground">
                    ₹{lead.booking.amount.toLocaleString("en-IN")}
                  </span>
                </p>
                <Link href="/admin/bookings" className="block text-[10px] text-primary hover:underline">
                  View in Bookings →
                </Link>
                {status !== "CONVERTED" && (
                  <button
                    onClick={() => handleStatusChange("CONVERTED")}
                    disabled={isPending}
                    className="w-full mt-1 flex items-center justify-center gap-1.5 text-xs font-bold bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Mark as Converted
                  </button>
                )}
              </div>
            ) : (
              <>
                <p className="text-[10px] text-muted-foreground">
                  Paste a booking ID to link this lead to a booking.
                </p>
                <input
                  type="text"
                  value={bookingInput}
                  onChange={(e) => setBookingInput(e.target.value)}
                  placeholder="Booking ID..."
                  className="w-full px-3 py-2 text-xs font-mono border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                />
                <button
                  onClick={() => patch({ bookingId: bookingInput.trim() })}
                  disabled={isPending || !bookingInput.trim()}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Link Booking
                </button>
              </>
            )}
          </div>

          {/* Lead ID */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Lead ID</p>
            <p className="font-mono text-[10px] text-foreground break-all">{lead.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
