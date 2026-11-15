"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Download, Eye, Loader2, Mail, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/admin/connect/ConfirmDialog";
import {
  DEPARTMENTS,
  DEPARTMENT_KEYS,
  FIXED_TERMS,
  COMMON_DUTIES,
  offerLetterInputSchema,
  termEndDate,
  longDate,
  type DepartmentKey,
  type OfferLetterInput,
} from "@/lib/offerLetters/schema";

export interface LetterRow {
  id: string;
  refNo: string;
  input: OfferLetterInput;
  sentAt: string | null;
  sentTo: string | null;
  createdAt: string;
}

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";
const labelCls = "mb-1 block text-[12px] font-semibold text-muted-foreground";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className={labelCls}>{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function OfferLetterClient({
  employee,
  fromProfile,
  letters,
}: {
  employee: { id: string; name: string };
  fromProfile: OfferLetterInput;
  letters: LetterRow[];
}) {
  const router = useRouter();
  const [busy, startBusy] = useTransition();
  const latest = letters[0];
  // Open the latest draft for editing; otherwise start a new letter from the profile.
  const [editingId, setEditingId] = useState<string | null>(latest && !latest.sentAt ? latest.id : null);
  const [form, setForm] = useState<OfferLetterInput>(latest && !latest.sentAt ? latest.input : fromProfile);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(
    latest && !latest.sentAt ? JSON.stringify(latest.input) : null,
  );
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<LetterRow | null>(null);
  // An already-emailed letter to send again (same PDF, same ref no.).
  const [confirmResend, setConfirmResend] = useState<LetterRow | null>(null);

  const dirty = savedSnapshot !== JSON.stringify(form);
  const editing = letters.find((l) => l.id === editingId) ?? null;
  const set = <K extends keyof OfferLetterInput>(key: K, value: OfferLetterInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const endDate = useMemo(
    () => (form.joiningDate ? longDate(termEndDate(form.joiningDate, FIXED_TERMS.termMonths)) : "—"),
    [form.joiningDate],
  );

  function changeDepartment(key: DepartmentKey) {
    const d = DEPARTMENTS[key];
    setForm((f) => ({ ...f, department: key, reportingOfficer: d.reportingOfficer, duties: [...d.duties] }));
  }

  function startNew(input: OfferLetterInput) {
    setEditingId(null);
    setSavedSnapshot(null);
    setForm({ ...input, letterDate: fromProfile.letterDate });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Validates and saves the form; resolves to the letter id, or null on failure. */
  async function save(): Promise<string | null> {
    const parsed = offerLetterInputSchema.safeParse({
      ...form,
      duties: form.duties.map((d) => d.trim()).filter(Boolean),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return null;
    }
    if (editingId && !dirty) return editingId;
    const res = await fetch(editingId ? `/api/offer-letters/${editingId}` : `/api/employees/${employee.id}/offer-letters`, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; refNo?: string; error?: string };
    if (!res.ok || !json.id) {
      toast.error(json.error ?? "Could not save the letter.");
      return null;
    }
    setEditingId(json.id);
    setForm(parsed.data);
    setSavedSnapshot(JSON.stringify(parsed.data));
    router.refresh();
    return json.id;
  }

  function saveThen(action: "download" | "preview") {
    // Open the preview tab synchronously so pop-up blockers allow it.
    const tab = action === "preview" ? window.open("", "_blank") : null;
    startBusy(async () => {
      const id = await save();
      if (!id) return void tab?.close();
      const url = `/api/offer-letters/${id}/pdf`;
      if (tab) tab.location.href = `${url}?inline=1`;
      else window.location.href = url;
    });
  }

  function send() {
    if (!editingId) return;
    setConfirmSend(false);
    startBusy(async () => {
      const res = await fetch(`/api/offer-letters/${editingId}/send`, { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { error?: string; sentTo?: string };
      if (!res.ok) return void toast.error(json.error ?? "Email failed.");
      toast.success(`Offer letter emailed to ${json.sentTo}.`);
      setEditingId(null);
      setSavedSnapshot(null);
      setForm({ ...form, letterDate: fromProfile.letterDate });
      router.refresh();
    });
  }

  function resend(letter: LetterRow) {
    setConfirmResend(null);
    startBusy(async () => {
      const res = await fetch(`/api/offer-letters/${letter.id}/send`, { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { error?: string; sentTo?: string };
      if (!res.ok) return void toast.error(json.error ?? "Email failed.");
      toast.success(`Offer letter emailed again to ${json.sentTo}.`);
      router.refresh();
    });
  }

  function remove(letter: LetterRow) {
    setConfirmDelete(null);
    startBusy(async () => {
      const res = await fetch(`/api/offer-letters/${letter.id}`, { method: "DELETE" });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) return void toast.error(json.error ?? "Delete failed.");
      toast.success("Draft deleted.");
      if (letter.id === editingId) startNew(fromProfile);
      router.refresh();
    });
  }

  const intern = form.engagementType === "INTERNSHIP";

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Employees
        </Link>
        <h2 className="mt-1 font-display text-xl font-extrabold text-foreground">Offer Letter — {employee.name}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {editing ? (
            <>
              Editing draft <span className="font-mono font-semibold text-foreground">{editing.refNo}</span>. Download
              and check it, then email it.
            </>
          ) : (
            "New letter, prefilled from the employee profile. Check every field, save and download, then email it."
          )}
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">Candidate</h3>
            <div className="grid gap-3 sm:grid-cols-[90px_1fr_1fr]">
              <Field label="Title">
                <select value={form.title} onChange={(e) => set("title", e.target.value as OfferLetterInput["title"])} className={inputCls}>
                  <option>Mr</option>
                  <option>Ms</option>
                  <option>Mrs</option>
                </select>
              </Field>
              <Field label="Full name">
                <input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Father's / guardian's name" hint="Printed under the name. Optional.">
                <input value={form.guardianName} onChange={(e) => set("guardianName", e.target.value)} className={inputCls} />
              </Field>
            </div>
            <Field label="Postal address" hint="One line per row — put the district, state and PIN on the last line.">
              <textarea
                rows={3}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                className={inputCls}
                placeholder={"Tarhama Kunzer\nBaramulla, Jammu & Kashmir – 193404"}
              />
            </Field>
            <Field label="Send to (personal email)">
              <input type="email" value={form.recipientEmail} onChange={(e) => set("recipientEmail", e.target.value)} className={inputCls} />
            </Field>
          </section>

          <section className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-bold text-foreground">Role</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Designation">
                <input
                  value={form.designation}
                  onChange={(e) => set("designation", e.target.value)}
                  className={inputCls}
                  placeholder="Full Stack Developer Intern"
                />
              </Field>
              <Field label="Engagement">
                <select
                  value={form.engagementType}
                  onChange={(e) => set("engagementType", e.target.value as OfferLetterInput["engagementType"])}
                  className={inputCls}
                >
                  <option value="INTERNSHIP">Internship (stipend, completion certificate)</option>
                  <option value="EMPLOYMENT">Employment (salary)</option>
                </select>
              </Field>
              <Field label="Department" hint="Sets the team, reporting officer and duties below.">
                <select value={form.department} onChange={(e) => changeDepartment(e.target.value as DepartmentKey)} className={inputCls}>
                  {DEPARTMENT_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {DEPARTMENTS[k].label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Reports to">
                <input value={form.reportingOfficer} onChange={(e) => set("reportingOfficer", e.target.value)} className={inputCls} />
              </Field>
            </div>
          </section>

          <section className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-bold text-foreground">Pay & dates</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={`Monthly ${intern ? "stipend" : "salary"} (₹)`}>
                <input
                  type="number"
                  min={0}
                  value={form.monthlyAmount || ""}
                  onChange={(e) => set("monthlyAmount", Math.round(Number(e.target.value) || 0))}
                  className={inputCls}
                />
              </Field>
              <Field label="Booking incentive (% of tour profit)" hint="On bookings they convert. 0 = no incentive clause.">
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  value={form.commissionPct || ""}
                  placeholder="0"
                  onChange={(e) => set("commissionPct", Math.max(0, Math.min(50, Number(e.target.value) || 0)))}
                  className={inputCls}
                />
              </Field>
              <Field label="Joining date">
                <input type="date" value={form.joiningDate} onChange={(e) => set("joiningDate", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Letter date">
                <input type="date" value={form.letterDate} onChange={(e) => set("letterDate", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Probation (months)" hint="0 removes the probation clause.">
                <input
                  type="number"
                  min={0}
                  max={6}
                  value={form.probationMonths}
                  onChange={(e) => set("probationMonths", Math.max(0, Math.min(6, Number(e.target.value) || 0)))}
                  className={inputCls}
                />
              </Field>
              <Field label="Notice period (months)">
                <input
                  type="number"
                  min={0}
                  max={3}
                  value={form.noticeMonths}
                  onChange={(e) => set("noticeMonths", Math.max(0, Math.min(3, Number(e.target.value) || 0)))}
                  className={inputCls}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-2 border-t border-border pt-4">
            <h3 className="text-sm font-bold text-foreground">Duties & responsibilities</h3>
            {form.duties.map((duty, i) => (
              <div key={i} className="flex items-start gap-2">
                <textarea
                  rows={2}
                  value={duty}
                  onChange={(e) => set("duties", form.duties.map((d, j) => (j === i ? e.target.value : d)))}
                  className={inputCls}
                />
                <button
                  type="button"
                  aria-label="Remove duty"
                  onClick={() => set("duties", form.duties.filter((_, j) => j !== i))}
                  className="mt-1 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set("duties", [...form.duties, ""])}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-primary/40 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10"
            >
              <Plus className="h-3.5 w-3.5" /> Add duty
            </button>
            <p className="text-[11px] text-muted-foreground">Always added at the end: {COMMON_DUTIES.map((d) => `“${d}”`).join(" ")}</p>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="space-y-2 rounded-2xl border border-border bg-card p-4 text-xs shadow-sm">
            <h3 className="text-sm font-bold text-foreground">Fixed terms (every letter)</h3>
            <p className="text-muted-foreground">
              Initial term <span className="font-semibold text-foreground">{FIXED_TERMS.termMonths} months</span>, ending{" "}
              <span className="font-semibold text-foreground">{endDate}</span>. The job then continues; designation and{" "}
              {intern ? "stipend" : "salary"} are reviewed if the KPI score is{" "}
              <span className="font-semibold text-foreground">{FIXED_TERMS.kpiThresholdPct}% or more</span>.
            </p>
            <p className="text-muted-foreground">
              Leaving or abandoning the job before the term ends:{" "}
              <span className="font-semibold text-foreground">₹{FIXED_TERMS.earlyExitAmount.toLocaleString("en-IN")}</span>{" "}
              liquidated damages, adjustable at final settlement. Not applied when the company ends the engagement.
            </p>
            <p className="text-muted-foreground">
              {FIXED_TERMS.annualLeaves} paid leaves a year · paid by the {FIXED_TERMS.payDay}th · signed by Farooq Sheikh, HR Manager.
            </p>
          </div>

          <div className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <button
              type="button"
              disabled={busy}
              onClick={() => saveThen("preview")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
            >
              <Eye className="h-4 w-4" /> Save & preview
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => saveThen("download")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Save & download PDF
            </button>
            <button
              type="button"
              disabled={busy || !editingId || dirty}
              onClick={() => setConfirmSend(true)}
              title={!editingId || dirty ? "Save and check the PDF first" : undefined}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
            >
              <Mail className="h-4 w-4" /> Email letter
            </button>
            <p className="text-[11px] text-muted-foreground">
              {!editingId || dirty
                ? "Save and download first to check the PDF — then you can email it."
                : `Sends the PDF to ${form.recipientEmail} with a cover email from HR. Emailed letters can't be edited.`}
            </p>
          </div>
        </aside>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <h3 className="border-b border-border px-5 py-3 text-sm font-bold text-foreground">Letters issued</h3>
        {letters.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-muted-foreground">No letters yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-xs">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2.5 font-semibold">Ref. No.</th>
                  <th className="px-4 py-2.5 font-semibold">Designation</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {letters.map((l) => (
                  <tr key={l.id} className={cn(l.id === editingId && "bg-primary/5")}>
                    <td className="px-5 py-3">
                      <p className="font-mono font-semibold text-foreground">{l.refNo}</p>
                      <p className="text-muted-foreground">Created {fmt(l.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground">{l.input.designation}</td>
                    <td className="px-4 py-3">
                      {l.sentAt ? (
                        <span className="text-emerald-700 dark:text-emerald-300">
                          Emailed {fmt(l.sentAt)}
                          <span className="block text-muted-foreground">to {l.sentTo}</span>
                        </span>
                      ) : (
                        <span className="rounded-md bg-amber-500/15 px-2 py-0.5 font-bold text-amber-700 dark:text-amber-300">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <a
                          href={`/api/offer-letters/${l.id}/pdf`}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 font-semibold text-foreground hover:bg-muted"
                        >
                          <Download className="h-3 w-3" /> PDF
                        </a>
                        {l.sentAt ? (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setConfirmResend(l)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 font-semibold text-emerald-700 hover:bg-muted disabled:opacity-50 dark:text-emerald-300"
                            >
                              <Mail className="h-3 w-3" /> Resend
                            </button>
                            <button
                              type="button"
                              onClick={() => startNew(l.input)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 font-semibold text-foreground hover:bg-muted"
                            >
                              <Plus className="h-3 w-3" /> New from this
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(l.id);
                                setForm(l.input);
                                setSavedSnapshot(JSON.stringify(l.input));
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 font-semibold text-foreground hover:bg-muted"
                            >
                              <Pencil className="h-3 w-3" /> Edit
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete draft ${l.refNo}`}
                              onClick={() => setConfirmDelete(l)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 font-semibold text-muted-foreground hover:bg-muted hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmSend}
        title={`Email the offer letter to ${form.recipientEmail}?`}
        description={`${form.title} ${form.fullName} will receive the PDF with a cover email from HR. After sending, this letter can't be edited — a correction becomes a new letter.`}
        confirmLabel="Send email"
        onConfirm={send}
        onCancel={() => setConfirmSend(false)}
      />
      <ConfirmDialog
        open={confirmResend !== null}
        title={confirmResend ? `Email ${confirmResend.refNo} again to ${confirmResend.input.recipientEmail}?` : ""}
        description="The same letter (PDF and reference number) is sent again with the HR cover email."
        confirmLabel="Send again"
        onConfirm={() => confirmResend && resend(confirmResend)}
        onCancel={() => setConfirmResend(null)}
      />
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete this draft?"
        description={confirmDelete ? `Draft ${confirmDelete.refNo} will be removed.` : undefined}
        confirmLabel="Delete"
        destructive
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
