"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/organisms/dialog";

interface Category {
  id: string;
  name: string;
  isSystem: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onChanged: () => void;
}

export function CategoryManagerDialog({ open, onOpenChange, categories, onChanged }: Props) {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function addCategory() {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const res = await fetch("/api/finance/expense-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j.error ?? "Failed to add category.");
        return;
      }
      setName("");
      toast.success("Category added.");
      onChanged();
    });
  }

  function deleteCategory(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/finance/expense-categories/${id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(j.error ?? "Failed to delete category.");
        return;
      }
      toast.success("Category deleted.");
      onChanged();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Manage Expense Categories</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
              <span className="text-sm text-foreground flex items-center gap-1.5">
                {c.name}
                {c.isSystem && <Lock className="h-3 w-3 text-muted-foreground" aria-label="System category, always kept" />}
              </span>
              {!c.isSystem && (
                <button
                  onClick={() => deleteCategory(c.id)}
                  disabled={isPending}
                  aria-label={`Delete category ${c.name}`}
                  className="text-muted-foreground hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
            placeholder="New category name…"
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={addCategory}
            disabled={isPending || !name.trim()}
            aria-label="Add category"
            className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
