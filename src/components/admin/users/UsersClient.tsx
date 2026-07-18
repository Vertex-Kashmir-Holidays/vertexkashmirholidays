"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Shield, User, Pencil, Trash2, RotateCcw, X, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { isStaff, type Role } from "@/lib/rbac";
import { usePagination } from "@/components/admin/ui/usePagination";
import { TablePagination } from "@/components/admin/ui/TablePagination";

const STAFF_ROLE_OPTIONS: Role[] = ["ADMIN", "SALES", "EDITOR"];

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: Role;
  bookingConversionPct: number | null;
  deletedAt: Date | string | null;
  createdAt: Date | string;
  _count: { bookings: number; reviews: number };
}

interface Props {
  initialCustomers: UserRow[];
  initialEmployees: UserRow[];
  currentUserId: string;
  currentUserRole: string;
}

type Tab = "customers" | "employees";

export function UsersClient({
  initialCustomers,
  initialEmployees,
  currentUserId,
  currentUserRole,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("customers");
  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState<UserRow | null>(null);
  const [adding, setAdding] = useState(false);

  const isSuperadmin = currentUserRole === "SUPERADMIN";
  const source = tab === "customers" ? initialCustomers : initialEmployees;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return source.filter((u) => {
      if (!showDeleted && u.deletedAt) return false;
      if (q === "") return true;
      return (
        (u.name ?? "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [source, search, showDeleted]);

  const { page, setPage, pageSize, changePageSize, pageCount, total, pageItems } =
    usePagination(filtered);
  // Reset to the first page when switching tabs so you don't land mid-list.
  useEffect(() => {
    setPage(1);
  }, [tab, setPage]);

  const deletedCount = source.filter((u) => u.deletedAt).length;

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

  function doDelete(u: UserRow, permanent: boolean) {
    if (u.id === currentUserId) {
      toast.error("You cannot delete your own account.");
      return;
    }
    setDeleting(null);
    runAction(permanent ? "Permanent delete" : "Soft delete", () =>
      fetch(`/api/users/${u.id}${permanent ? "?permanent=1" : ""}`, { method: "DELETE" }),
    );
  }

  function handlePermanentDelete(u: UserRow) {
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

  function handleRestore(u: UserRow) {
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
          <h2 className="font-display font-extrabold text-foreground text-xl">Users</h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            {initialCustomers.length} customers · {initialEmployees.length} employees
          </p>
        </div>
        {tab === "employees" && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 self-start rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            <UserPlus className="h-4 w-4" /> Add Employee
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(
          [
            ["customers", "Customers", initialCustomers.length],
            ["employees", "Employees", initialEmployees.length],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              setSearch("");
            }}
            className={cn(
              "px-4 py-2 text-sm font-semibold -mb-px border-b-2 transition-colors",
              tab === key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            <span className="ml-2 text-[12px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {count}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone..."
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
                {(tab === "customers"
                  ? ["User", "Phone", "Bookings", "Reviews", "Joined", "Actions"]
                  : ["User", "Role", "Phone", "Joined", "Actions"]
                ).map((h) => (
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
                  <td
                    colSpan={tab === "customers" ? 6 : 5}
                    className="px-4 py-12 text-center text-muted-foreground text-sm"
                  >
                    No {tab} found.
                  </td>
                </tr>
              ) : (
                pageItems.map((u) => {
                  const isDeleted = !!u.deletedAt;
                  const isSelf = u.id === currentUserId;
                  // Non-superadmins cannot act on a superadmin row.
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
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                              isStaff(u.role)
                                ? "bg-primary text-white"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {isStaff(u.role) ? (
                              <Shield className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
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
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {tab === "employees" && (
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "text-[12px] font-bold px-2 py-0.5 rounded-full",
                              isStaff(u.role)
                                ? "bg-primary text-white"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {u.role}
                          </span>
                        </td>
                      )}

                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {u.phone ?? "—"}
                      </td>

                      {tab === "customers" && (
                        <>
                          <td className="px-4 py-3 text-xs font-semibold text-foreground">
                            {u._count.bookings}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-foreground">
                            {u._count.reviews}
                          </td>
                        </>
                      )}

                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })}
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
          noun={tab === "customers" ? "customers" : "employees"}
        />
      </div>

      {editing && (
        <EditModal
          user={editing}
          isEmployee={tab === "employees"}
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
  user: UserRow;
  isPending: boolean;
  onClose: () => void;
  onSoft: () => void;
  onPermanent: () => void;
}) {
  const [confirmPermanent, setConfirmPermanent] = useState(false);
  const who = user.name ?? user.email;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-foreground">Delete {who}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!confirmPermanent ? (
          <>
            <p className="text-xs text-muted-foreground">Choose how to delete this user.</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={onSoft}
                disabled={isPending}
                className="w-full text-left rounded-xl border border-border p-3 hover:bg-muted disabled:opacity-50"
              >
                <span className="block text-sm font-semibold text-foreground">Soft delete</span>
                <span className="block text-[12px] text-muted-foreground mt-0.5">
                  Hide the user and block their login. Reversible — you can restore them later.
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
      </div>
    </div>
  );
}

interface EditPayload {
  name: string;
  email: string;
  phone: string | null;
  role?: Role;
  bookingConversionPct?: number | null;
  password?: string;
}

interface CreatePayload {
  name: string;
  email: string;
  phone: string;
  role: Role;
  password: string;
  bookingConversionPct?: number | null;
}

function EditModal({
  user,
  isEmployee,
  allowSuperadmin,
  isPending,
  onClose,
  onSave,
}: {
  user: UserRow;
  isEmployee: boolean;
  allowSuperadmin: boolean;
  isPending: boolean;
  onClose: () => void;
  onSave: (p: EditPayload) => void;
}) {
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [role, setRole] = useState<Role>(user.role);
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
    // Customers stay CUSTOMER; only employees can have their staff role edited.
    if (isEmployee && role !== user.role) payload.role = role;
    // Booking conversion % (incentive on profit) — employees only, optional.
    if (isEmployee) {
      const next = bookingConversionPct.trim() === "" ? null : parseFloat(bookingConversionPct);
      const current = user.bookingConversionPct ?? null;
      if (next !== current) payload.bookingConversionPct = next;
    }
    // Optional admin password reset — only sent when a new password was typed.
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
        className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-foreground">
            Edit {isEmployee ? "employee" : "customer"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
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
          <Field label="Phone">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
              className={inputCls}
            />
          </Field>
          {isEmployee && (
            <Field label="Role">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                disabled={user.role === "SUPERADMIN" && !allowSuperadmin}
                className={inputCls}
              >
                {/* Keep the current role selectable even if not in the option list. */}
                {!roleOptions.includes(role) && <option value={role}>{role}</option>}
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {isEmployee && (
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
          )}
          <Field label="Reset password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              autoComplete="new-password"
              className={inputCls}
            />
            <span className="mt-1 block text-[12px] text-muted-foreground">
              Min 8 characters. The user will be asked to set their own on next login.
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
        className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-foreground">Add employee</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
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
          <Field label="Phone">
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
          <Field label="Temporary password">
            <input
              type="password"
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
