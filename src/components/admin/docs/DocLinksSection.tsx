"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Pencil, Plus, Trash2, Link2 } from "lucide-react";
import { DocLinkModal } from "./DocLinkModal";

export interface DocLinkItem {
  id: string;
  title: string;
  url: string;
  purpose: string;
  createdByName: string;
  createdAt: Date | string;
}

interface Props {
  initialLinks: DocLinkItem[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

function fmtDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function DocLinksSection({ initialLinks, canCreate, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DocLinkItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(link: DocLinkItem) {
    setEditing(link);
    setModalOpen(true);
  }

  async function handleSave(payload: { title: string; url: string; purpose: string }): Promise<boolean> {
    try {
      const res = editing
        ? await fetch(`/api/admin/docs/links/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/docs/links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        toast.error(error || "Save failed.");
        return false;
      }
      toast.success(editing ? "Link updated." : "Link added.");
      router.refresh();
      return true;
    } catch {
      toast.error("Save failed.");
      return false;
    }
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/docs/links/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        toast.success("Link removed.");
        router.refresh();
      } catch {
        toast.error("Failed to delete.");
      } finally {
        setConfirmDeleteId(null);
      }
    });
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-foreground text-sm">Useful Links</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Quick access to published rate cards, reports, and other links worth keeping handy.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openCreate}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-primary border border-border px-3 py-1.5 rounded-lg hover:bg-primary/10"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Link
          </button>
        )}
      </div>

      {initialLinks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
          <Link2 className="w-6 h-6 text-muted-foreground/50" />
          <p className="text-[12px] text-muted-foreground">No links yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Link</th>
                <th className="px-3 py-2">Purpose</th>
                <th className="px-3 py-2">Added</th>
                {(canEdit || canDelete) && <th className="px-3 py-2 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {initialLinks.map((link) => (
                <tr key={link.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5 font-semibold text-foreground align-top">{link.title}</td>
                  <td className="px-3 py-2.5 align-top">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline break-all"
                    >
                      Open <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground align-top max-w-xs">{link.purpose}</td>
                  <td className="px-3 py-2.5 text-[11px] text-muted-foreground align-top whitespace-nowrap">
                    {fmtDate(link.createdAt)} · {link.createdByName}
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="px-3 py-2.5 align-top">
                      <div className="flex items-center justify-end gap-1.5">
                        {canEdit && (
                          <button
                            onClick={() => openEdit(link)}
                            title="Edit"
                            aria-label={`Edit link ${link.title}`}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete &&
                          (confirmDeleteId === link.id ? (
                            <button
                              onClick={() => handleDelete(link.id)}
                              disabled={isPending}
                              className="text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 px-2.5 py-1.5 rounded-lg"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(link.id)}
                              title="Delete"
                              aria-label={`Delete link ${link.title}`}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DocLinkModal link={editing} open={modalOpen} onOpenChange={setModalOpen} onSave={handleSave} />
    </div>
  );
}
