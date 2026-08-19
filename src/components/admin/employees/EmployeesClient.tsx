"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Shield, Pencil, Trash2, RotateCcw, X, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/rbac";
import { usePagination } from "@/components/admin/ui/usePagination";
import { TablePagination } from "@/components/admin/ui/TablePagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/organisms/dialog";
import { PasswordInput } from "@/components/ui/atoms/PasswordInput";

const STAFF_ROLE_OPTIONS: Role[] = ["ADMIN", "SALES", "EDITOR"];

interface EmployeeRow {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: Role;
  designation: string | null;
  employeeCode: string | null;
  monthlySalary: number | null;
  bookingConversionPct: number | null;
  joiningDate: Date | string | null;
  personalEmail: string | null;
  personalPhone: string | null;
  address: string | null;
  deletedAt: Date | string | null;
  createdAt: Date | string;
}

interface Props {
  initialEmployees: EmployeeRow[];
  currentUserId: string;
  currentUserRole: string;
}

export function EmployeesClient({ initialEmployees, currentUserId, currentUserRole }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [editing, setEditing] = useState<EmployeeRow | null>(null);
  const [deleting, setDeleting] = useState<EmployeeRow | null>(null);
  const [adding, setAdding] = useState(false);

  const isSuperadmin = currentUserRole === "SUPERADMIN";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialEmployees.filter((u) => {
      if (!showDeleted && u.deletedAt) return false;
      if (q === "") return true;
      return (
        (u.name ?? "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? "").toLowerCase().includes(q) ||
        (u.employeeCode ?? "").toLowerCase().includes(q)
      );
    });
  }, [initialEmployees, search, showDeleted]);

  const { page, setPage, pageSize, changePageSize, pageCount, total, pageItems } =
    usePagination(filtered);

  const deletedCount = initialEmployees.filter((u) => u.deletedAt).length;

  function runAction(label: string, fn: () => Promise<Response>) {
    startTransition(async () => {
      try {
        const res = await fn();
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(typeof data.error === "string" ? data.error : `${label} failed.`);
        }
        toast.success(`${label} succeeded.`);
        setEditing(null);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error && err.message ? err.message : `${label} failed.`);
      }
    });
  }

  function doDelete(u: EmployeeRow, permanent: boolean) {
    if (u.id === currentUserId) {
      toast.error("You cannot delete your own account.");
      return;
    }
    setDeleting(null);
    runAction(permanent ? "Permanent delete" : "Soft delete", () =>
      fetch(`/api/users/${u.id}${permanent ? "?permanent=1" : ""}`, { method: "DELETE" }),
    );
  }

  function handlePermanentDelete(u: EmployeeRow) {
    if (u.id === currentUserId) return toast.error("You cannot delete your own account.");
    if (
      !confirm(
        `PERMANENTLY delete ${u.name ?? u.email}? This cannot be undone. Their bookings and reviews will be unlinked and any itineraries deleted.`,
      )
    )
      return;
    runAction("Permanent delete", () =>
      fetch(`/api/users/${u.id}?permanent=1`, { method: "DELETE" }),
    );
  }

  function handleRestore(u: EmployeeRow) {
    runAction("Restore", () => fetch(`/api/users/${u.id}/restore`, { method: "POST" }));
  }

  function handleSaveEdit(form: EditPayload) {
    if (!editing) return;
    runAction("Save", () =>
      fetch(`/api/users/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }),
    );
  }

  function handleCreate(form: CreatePayload) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(typeof data.error === "string" ? data.error : "Create failed.");
        }
        toast.success("Employee added.");
        setAdding(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error && err.message ? err.message : "Create failed.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Employees</h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            {initialEmployees.length} employees
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" /> Add Employee
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone or employee ID..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-muted/50"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground self-center shrink-0 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="rounded border-border"
            />
            Show deleted{deletedCount > 0 ? ` (${deletedCount})` : ""}
          </label>
          <p className="text-xs text-muted-foreground self-center shrink-0">
            {filtered.length} results
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-t border-b border-border">
                {["Employee", "Role", "Designation", "Phone", "Joined", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[12px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No employees found.
                  </td>
                </tr>
              ) : (
                pageItems.map((u) => {
                  const isDeleted = !!u.deletedAt;
                  const isSelf = u.id === currentUserId;
                  const lockedSuper = u.role === "SUPERADMIN" && !isSuperadmin;
                  return (
                    <tr
                      key={u.id}
                      className={cn(
                        "hover:bg-muted/50 transition-colors",
                        isDeleted && "opacity-60",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                            <Shield className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p
                              className={cn(
                                "font-semibold text-foreground text-xs",
                                isDeleted && "line-through",
                              )}
                            >
                              {u.name ?? "—"}
                              {isDeleted && (
                                <span className="ml-2 text-[10px] font-bold text-destructive uppercase">
                                  deleted
                                </span>
                              )}
                              {isSelf && (
                                <span className="ml-2 text-[10px] text-muted-foreground/60">
                                  you
                                </span>
                              )}
                            </p>
                            <p className="text-[12px] text-muted-foreground truncate max-w-[180px]">
                              {u.employeeCode ? `${u.employeeCode} · ` : ""}
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-primary text-white">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {u.designation ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {u.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {u.joiningDate
                          ? new Date(u.joiningDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {isDeleted ? (
                            <>
                              <button
                                onClick={() => handleRestore(u)}
                                disabled={isPending || lockedSuper}
                                title="Restore"
                                className="inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Restore
                              </button>
                              <button
                                onClick={() => handlePermanentDelete(u)}
                                disabled={isPending || isSelf || lockedSuper}
                                title="Delete permanently"
                                className="inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-lg border border-destructive/40 text-destructive hover:bg-red-500 disabled:opacity-40"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Forever
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditing(u)}
                                disabled={isPending || lockedSuper}
                                title="Edit"
                                className="inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => setDeleting(u)}
                                disabled={isPending || isSelf || lockedSuper}
                                title="Delete"
                                className="inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          pageSize={pageSize}
          pageCount={pageCount}
          total={total}
          onPage={setPage}
          onPageSize={changePageSize}
          noun="employees"
        />
      </div>

      {editing && (
        <EditModal
          user={editing}
          allowSuperadmin={isSuperadmin}
          isPending={isPending}
          onClose={() => setEditing(null)}
          onSave={handleSaveEdit}
        />
      )}

      {adding && (
        <AddEmployeeModal
          allowSuperadmin={isSuperadmin}
          isPending={isPending}
          onClose={() => setAdding(false)}
          onCreate={handleCreate}
        />
      )}

      {deleting && (
        <DeleteModal
          user={deleting}
          isPending={isPending}
          onClose={() => setDeleting(null)}
          onSoft={() => doDelete(deleting, false)}
          onPermanent={() => doDelete(deleting, true)}
        />
      )}
    </div>
  );
}

function DeleteModal({
  user,
  isPending,
  onClose,
  onSoft,
  onPermanent,
}: {
  user: EmployeeRow;
  isPending: boolean;
  onClose: () => void;
  onSoft: () => void;
  onPermanent: () => void;
}) {
  const [confirmPermanent, setConfirmPermanent] = useState(false);
  const who = user.name ?? user.email;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md space-y-4">
        <DialogHeader>
          <DialogTitle>Delete {who}</DialogTitle>
        </DialogHeader>

        {!confirmPermanent ? (
          <>
            <p className="text-xs text-muted-foreground">Choose how to delete this employee.</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={onSoft}
                disabled={isPending}
                className="w-full text-left rounded-xl border border-border p-3 hover:bg-muted disabled:opacity-50"
              >
                <span className="block text-sm font-semibold text-foreground">Soft delete</span>
                <span className="block text-[12px] text-muted-foreground mt-0.5">
                  Hide the employee and block their login. Reversible — you can restore them later.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmPermanent(true)}
                disabled={isPending}
                className="w-full text-left rounded-xl border border-destructive/40 p-3 hover:bg-red-500 disabled:opacity-50"
              >
                <span className="block text-sm font-semibold text-destructive">
                  Permanent delete
                </span>
                <span className="block text-[12px] text-muted-foreground mt-0.5">
                  Remove the row for good. Bookings and reviews are unlinked; itineraries are
                  deleted. Cannot be undone.
                </span>
              </button>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-sm font-semibold rounded-xl border border-border text-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-foreground">
              Permanently delete <span className="font-semibold">{who}</span>? This{" "}
              <span className="font-semibold">cannot be undone</span>.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmPermanent(false)}
                className="px-3 py-2 text-sm font-semibold rounded-xl border border-border text-foreground hover:bg-muted"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onPermanent}
                disabled={isPending}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-500 text-white hover:bg-red-500 disabled:opacity-50"
              >
                {isPending ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface EditPayload {
  name: string;
  email: string;
  phone: string | null;
  role?: Role;
  bookingConversionPct?: number | null;
  designation?: string | null;
  employeeCode?: string | null;
  monthlySalary?: number | null;
  joiningDate?: string | null;
  personalEmail?: string | null;
  personalPhone?: string | null;
  address?: string | null;
  password?: string;
}

interface CreatePayload {
  name: string;
  email: string;
  phone: string;
  role: Role;
  password: string;
  bookingConversionPct?: number | null;
  designation?: string | null;
  employeeCode?: string | null;
  monthlySalary?: number | null;
  joiningDate?: string | null;
  personalEmail?: string | null;
  personalPhone?: string | null;
  address?: string | null;
}

function EditModal({
  user,
  allowSuperadmin,
  isPending,
  onClose,
  onSave,
}: {
  user: EmployeeRow;
  allowSuperadmin: boolean;
  isPending: boolean;
  onClose: () => void;
  onSave: (p: EditPayload) => void;
}) {
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [role, setRole] = useState<Role>(user.role);
  const [designation, setDesignation] = useState(user.designation ?? "");
  const [employeeCode, setEmployeeCode] = useState(user.employeeCode ?? "");
  const [monthlySalary, setMonthlySalary] = useState(
    user.monthlySalary != null ? String(user.monthlySalary) : "",
  );
  const [joiningDate, setJoiningDate] = useState(
    user.joiningDate ? new Date(user.joiningDate).toISOString().slice(0, 10) : "",
  );
  const [personalEmail, setPersonalEmail] = useState(user.personalEmail ?? "");
  const [personalPhone, setPersonalPhone] = useState(user.personalPhone ?? "");
  const [address, setAddress] = useState(user.address ?? "");
  const [bookingConversionPct, setBookingConversionPct] = useState<string>(
    user.bookingConversionPct != null ? String(user.bookingConversionPct) : "",
  );
  const [password, setPassword] = useState("");

  const roleOptions: Role[] = allowSuperadmin
    ? ["SUPERADMIN", ...STAFF_ROLE_OPTIONS]
    : [...STAFF_ROLE_OPTIONS];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password && password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    const payload: EditPayload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() === "" ? null : phone.trim(),
    };
    if (role !== user.role) payload.role = role;
    const nextPct = bookingConversionPct.trim() === "" ? null : parseFloat(bookingConversionPct);
    if (nextPct !== (user.bookingConversionPct ?? null)) payload.bookingConversionPct = nextPct;
    const nextDesignation = designation.trim() === "" ? null : designation.trim();
    if (nextDesignation !== (user.designation ?? null)) payload.designation = nextDesignation;
    const nextCode = employeeCode.trim() === "" ? null : employeeCode.trim();
    if (nextCode !== (user.employeeCode ?? null)) payload.employeeCode = nextCode;
    const nextSalary = monthlySalary.trim() === "" ? null : parseFloat(monthlySalary);
    if (nextSalary !== (user.monthlySalary ?? null)) payload.monthlySalary = nextSalary;
    const currentJoining = user.joiningDate ? new Date(user.joiningDate).toISOString().slice(0, 10) : "";
    if (joiningDate !== currentJoining) payload.joiningDate = joiningDate || null;
    const nextPersonalEmail = personalEmail.trim() === "" ? null : personalEmail.trim();
    if (nextPersonalEmail !== (user.personalEmail ?? null)) payload.personalEmail = nextPersonalEmail;
    const nextPersonalPhone = personalPhone.trim() === "" ? null : personalPhone.trim();
    if (nextPersonalPhone !== (user.personalPhone ?? null)) payload.personalPhone = nextPersonalPhone;
    const nextAddress = address.trim() === "" ? null : address.trim();
    if (nextAddress !== (user.address ?? null)) payload.address = nextAddress;
    if (password) payload.password = password;
    onSave(payload);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-xl bg-card rounded-2xl border border-border shadow-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-foreground">Edit employee</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit employee dialog"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputCls}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputCls}
              />
            </Field>
            <Field label="Official Phone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
                className={inputCls}
              />
            </Field>
            <Field label="Role">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                disabled={user.role === "SUPERADMIN" && !allowSuperadmin}
                className={inputCls}
              >
                {!roleOptions.includes(role) && <option value={role}>{role}</option>}
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Designation">
              <input
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Sales Executive"
                className={inputCls}
              />
            </Field>
            <Field label="Employee ID">
              <input
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="Optional"
                className={inputCls}
              />
            </Field>
            <Field label="Monthly Salary (₹)">
              <input
                type="number"
                min={0}
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                placeholder="Optional"
                className={inputCls}
              />
            </Field>
            <Field label="Joining Date">
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide pt-1">
            Personal Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Personal Email">
              <input
                type="email"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                placeholder="Optional"
                className={inputCls}
              />
            </Field>
            <Field label="Personal Phone">
              <input
                value={personalPhone}
                onChange={(e) => setPersonalPhone(e.target.value)}
                placeholder="Optional"
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Address">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Optional"
              className={inputCls}
            />
          </Field>

          <Field label="Booking Conversion % (incentive on profit)">
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={bookingConversionPct}
              onChange={(e) => setBookingConversionPct(e.target.value)}
              placeholder="Optional — e.g. 5 or 10"
              className={inputCls}
            />
          </Field>
          <Field label="Reset password">
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              autoComplete="new-password"
              className={inputCls}
            />
            <span className="mt-1 block text-[12px] text-muted-foreground">
              Min 8 characters. The employee will be asked to set their own on next login.
            </span>
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm font-semibold rounded-xl border border-border text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AddEmployeeModal({
  allowSuperadmin,
  isPending,
  onClose,
  onCreate,
}: {
  allowSuperadmin: boolean;
  isPending: boolean;
  onClose: () => void;
  onCreate: (p: CreatePayload) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("SALES");
  const [password, setPassword] = useState("");
  const [designation, setDesignation] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [personalPhone, setPersonalPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bookingConversionPct, setBookingConversionPct] = useState("");

  const roleOptions: Role[] = allowSuperadmin
    ? ["SUPERADMIN", ...STAFF_ROLE_OPTIONS]
    : [...STAFF_ROLE_OPTIONS];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required.");
    if (!email.trim()) return toast.error("Email is required.");
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    onCreate({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      password,
      designation: designation.trim() || null,
      employeeCode: employeeCode.trim() || null,
      monthlySalary: monthlySalary.trim() === "" ? null : parseFloat(monthlySalary),
      joiningDate: joiningDate || null,
      personalEmail: personalEmail.trim() || null,
      personalPhone: personalPhone.trim() || null,
      address: address.trim() || null,
      bookingConversionPct:
        bookingConversionPct.trim() === "" ? null : parseFloat(bookingConversionPct),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-xl bg-card rounded-2xl border border-border shadow-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-foreground">Add employee</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add employee dialog"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputCls}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputCls}
              />
            </Field>
            <Field label="Official Phone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
                className={inputCls}
              />
            </Field>
            <Field label="Role">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className={inputCls}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Designation">
              <input
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Sales Executive"
                className={inputCls}
              />
            </Field>
            <Field label="Employee ID">
              <input
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="Optional"
                className={inputCls}
              />
            </Field>
            <Field label="Monthly Salary (₹)">
              <input
                type="number"
                min={0}
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                placeholder="Optional"
                className={inputCls}
              />
            </Field>
            <Field label="Joining Date">
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide pt-1">
            Personal Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Personal Email">
              <input
                type="email"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                placeholder="Optional"
                className={inputCls}
              />
            </Field>
            <Field label="Personal Phone">
              <input
                value={personalPhone}
                onChange={(e) => setPersonalPhone(e.target.value)}
                placeholder="Optional"
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Address">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Optional"
              className={inputCls}
            />
          </Field>

          <Field label="Temporary password">
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              autoComplete="new-password"
              required
              className={inputCls}
            />
            <span className="mt-1 block text-[12px] text-muted-foreground">
              The employee will be asked to set their own password on first login.
            </span>
          </Field>
          <Field label="Booking Conversion % (incentive on profit)">
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={bookingConversionPct}
              onChange={(e) => setBookingConversionPct(e.target.value)}
              placeholder="Optional — e.g. 5 or 10"
              className={inputCls}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm font-semibold rounded-xl border border-border text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "Adding…" : "Add employee"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-border rounded-xl bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
