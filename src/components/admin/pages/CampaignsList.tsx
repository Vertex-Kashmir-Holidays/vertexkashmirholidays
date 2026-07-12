"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignRow {
  id: string;
  name: string;
  slug: string;
  published: boolean;
  updatedAt: Date | string;
}

export function CampaignsList({ items, canDelete }: { items: CampaignRow[]; canDelete: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function remove(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        toast.success("Campaign deleted.");
        setConfirmDelete(null);
        router.refresh();
      } catch {
        toast.error("Delete failed.");
      }
    });
  }

  if (items.length === 0) {
    return <p className="rounded-2xl border border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">No campaigns yet.</p>;
  }

  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card shadow-sm">
      {items.map((c) => (
        <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold text-foreground">{c.name}</p>
              <span className={cn("rounded-full px-2 py-0.5 text-[12px] font-bold", c.published ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground")}>
                {c.published ? "Published" : "Draft"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">/adventures/{c.slug}</p>
          </div>
          <Link href={`/adventures/${c.slug}`} target="_blank" className="text-muted-foreground hover:text-primary" aria-label="View live">
            <ExternalLink className="h-4 w-4" />
          </Link>
          <Link href={`/admin/campaigns/${c.id}`} className="text-muted-foreground hover:text-foreground" aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </Link>
          {canDelete &&
            (confirmDelete === c.id ? (
              <span className="flex items-center gap-1">
                <button onClick={() => remove(c.id)} disabled={isPending} className="rounded bg-red-600 px-2 py-0.5 text-[12px] font-bold text-white">Delete</button>
                <button onClick={() => setConfirmDelete(null)} className="text-[12px] text-muted-foreground">Cancel</button>
              </span>
            ) : (
              <button onClick={() => setConfirmDelete(c.id)} className="text-muted-foreground hover:text-red-500 dark:text-red-400" aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            ))}
        </div>
      ))}
    </div>
  );
}
