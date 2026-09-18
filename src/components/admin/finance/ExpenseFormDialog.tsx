"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/organisms/dialog";
import { PAYMENT_METHODS } from "@/lib/payments/gst";

export interface ExpenseFormValues {
  id?: string;
  date: string; // yyyy-mm-dd
  categoryId: string;
  description: string;
  amount: string;
  paymentMethod: string;
  employeeId: string;
  reference: string;
  notes: string;
}

const EMPTY: ExpenseFormValues = {
  date: new Date().toISOString().slice(0, 10),
  categoryId: "",
  description: "",
  amount: "",
  paymentMethod: "",
  employeeId: "",
  reference: "",
  notes: "",
};

interface Category {
  id: string;
  name: string;
}
interface Employee {
  id: string;
  name: string | null;
  email: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  employees: Employee[];
  defaults?: ExpenseFormValues;
  onSaved: () => void;
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";
const labelClass = "block text-xs font-semibold text-foreground mb-1";

export function ExpenseFormDialog({ open, onOpenChange, categories, employees, defaults, onSaved }: Props) {
  const [values, setValues] = useState<ExpenseFormValues>(defaults ?? EMPTY);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) setValues(defaults ?? EMPTY);
  }, [open, defaults]);

  function set<K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.categoryId) {
      toast.error("Select a category.");
      return;
    }
    const amount = Number(values.amount);
    if (!(amount > 0)) {
      toast.error("Enter a valid amount.");
      return;
    }

    startTransition(async () => {
      const payload = {
        date: values.date,
        categoryId: values.categoryId,
        description: values.description || undefined,
        amount,
        paymentMethod: values.paymentMethod || undefined,
        employeeId: values.employeeId || undefined,
        reference: values.reference || undefined,
        notes: values.notes || undefined,
      };
      const url = values.id ? `/api/finance/expenses/${values.id}` : "/api/finance/expenses";
      const method = values.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j.error ?? "Failed to save expense.");
        return;
      }
      toast.success(values.id ? "Expense updated." : "Expense added.");
      onOpenChange(false);
      onSaved();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{values.id ? "Edit Expense" : "Add Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Date</label>
              <input
                type="date"
                required
                value={values.date}
                onChange={(e) => set("date", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Amount (₹)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                required
                value={values.amount}
                onChange={(e) => set("amount", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select
              required
              value={values.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className={inputClass}
            >
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <input
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputClass}
              placeholder="e.g. Facebook ad campaign — August"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Payment Method</label>
              <select
                value={values.paymentMethod}
                onChange={(e) => set("paymentMethod", e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Employee (if applicable)</label>
              <select
                value={values.employeeId}
                onChange={(e) => set("employeeId", e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name ?? emp.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Reference / Receipt</label>
            <input
              value={values.reference}
              onChange={(e) => set("reference", e.target.value)}
              className={inputClass}
              placeholder="Invoice #, receipt link, UTR…"
            />
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={values.notes}
              onChange={(e) => set("notes", e.target.value)}
              className={inputClass}
              rows={2}
            />
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {values.id ? "Save Changes" : "Add Expense"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
