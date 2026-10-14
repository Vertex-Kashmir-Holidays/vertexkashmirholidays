"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, ExternalLink, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/atoms/badge";

interface AdventureRow {
  id: string;
  name: string;
  slug: string;
  published: boolean;
  updatedAt: Date | string;
}

export function AdventuresList({
  items,
  canEdit,
  canDelete,
}: {
  items: AdventureRow[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function togglePublished(c: AdventureRow) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/adventures/${c.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: !c.published }),
        });
        if (!res.ok) throw new Error();
        toast.success(
          c.published ? "Adventure unpublished — its page now returns 404." : "Adventure is live.",
        );
        router.refresh();
      } catch {
        toast.error("Update failed.");
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/adventures/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        toast.success("Adventure deleted.");
        setConfirmDelete(null);
        router.refresh();
      } catch {
        toast.error("Delete failed.");
      }
    });
  }

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">
        No adventures yet.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card shadow-sm">
      {items.map((c) => (
        <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold text-foreground">{c.name}</p>
              <Badge variant={c.published ? "success" : "default"}>
                {c.published ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">/adventures/{c.slug}</p>
          </div>
          <Link
            href={`/adventures/${c.slug}`}
            target="_blank"
            className="text-muted-foreground hover:text-primary"
            aria-label="View live"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
          <Link
            href={`/admin/adventures/${c.id}`}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          {canEdit && (
            <button
              onClick={() => togglePublished(c)}
              disabled={isPending}
              className="text-muted-foreground hover:text-primary"
              title={c.published ? "Unpublish" : "Publish"}
              aria-label={c.published ? "Unpublish" : "Publish"}
            >
              {c.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
          {canDelete &&
            (confirmDelete === c.id ? (
              <span className="flex items-center gap-1">
                <button
                  onClick={() => remove(c.id)}
                  disabled={isPending}
                  className="rounded bg-red-600 px-2 py-0.5 text-[12px] font-bold text-white"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="text-[12px] text-muted-foreground"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmDelete(c.id)}
                className="text-muted-foreground hover:text-red-500 dark:text-red-400"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ))}
        </div>
      ))}
    </div>
  );
}
