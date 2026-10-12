"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Trash2, FileText, Download, FolderOpen, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOC_CATEGORIES, docDownloadFilename, type DocCategory } from "@/lib/docs/categories";
import { DocLinksSection, type DocLinkItem } from "./DocLinksSection";
import { DocModal, type DocMetaPayload } from "./DocModal";

interface DocItem {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByName: string;
  createdAt: Date | string;
}

interface Props {
  initialItems: DocItem[];
  initialLinks: DocLinkItem[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

function fmtSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function fmtDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const CATEGORY_HINTS: Record<DocCategory, string> = {
  "Company Profile": "The company profile PDF shared with partners and clients.",
  B2B: "Rates, payment policy, privacy policy, itinerary samples — anything shared with B2B agents. Every file uploaded here shows up on the agent's account profile.",
  General: "Anything else worth keeping here for staff to find and share.",
};

export function DocsClient({ initialItems, initialLinks, canCreate, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // Upload (doc = null) into a category, or edit an existing doc's title/purpose.
  const [modal, setModal] = useState<{ category: DocCategory; doc: DocItem | null } | null>(null);

  async function handleSave({ title, description, file }: DocMetaPayload): Promise<boolean> {
    if (!modal) return false;
    try {
      let res: Response;
      if (modal.doc) {
        res = await fetch(`/api/admin/docs/${modal.doc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description }),
        });
      } else {
        const fd = new FormData();
        if (file) fd.append("file", file);
        fd.append("title", title);
        fd.append("description", description);
        fd.append("category", modal.category);
        res = await fetch("/api/admin/docs", { method: "POST", body: fd });
      }
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        toast.error(error || "Save failed.");
        return false;
      }
      toast.success(modal.doc ? "Document updated." : "Document uploaded.");
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
        const res = await fetch(`/api/admin/docs/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        toast.success("Document removed.");
        router.refresh();
      } catch {
        toast.error("Failed to delete.");
      } finally {
        setConfirmDeleteId(null);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-extrabold text-foreground text-xl">Docs</h2>
        <p className="text-muted-foreground text-xs mt-0.5">
          Reference documents for staff to view, download, and share — company profile and B2B
          documents (rates, policies, itinerary samples).
        </p>
      </div>

      <DocLinksSection
        initialLinks={initialLinks}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {DOC_CATEGORIES.map((category) => {
          const items = initialItems.filter((i) => i.category === category);
          return (
            <div
              key={category}
              className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-foreground text-sm">{category}</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {CATEGORY_HINTS[category]}
                  </p>
                </div>
                {canCreate && (
                  <button
                    onClick={() => setModal({ category, doc: null })}
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-primary border border-border px-3 py-1.5 rounded-lg hover:bg-primary/10"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
                  <FolderOpen className="w-6 h-6 text-muted-foreground/50" />
                  <p className="text-[12px] text-muted-foreground">No documents yet.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {items.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5"
                    >
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground break-words">
                          {doc.title}
                        </p>
                        {doc.description && (
                          <p className="text-[12px] text-muted-foreground break-words">
                            {doc.description}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          {fmtSize(doc.sizeBytes)} · {doc.uploadedByName} · {fmtDate(doc.createdAt)}
                        </p>
                      </div>
                      <a
                        href={`/api/docs/${doc.id}/download`}
                        download={docDownloadFilename(doc.title, doc.mimeType)}
                        title="Download"
                        className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      {canEdit && (
                        <button
                          onClick={() => setModal({ category, doc })}
                          title="Edit title & purpose"
                          className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete &&
                        (confirmDeleteId === doc.id ? (
                          <button
                            onClick={() => handleDelete(doc.id)}
                            disabled={isPending}
                            className="shrink-0 text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 px-2.5 py-1.5 rounded-lg"
                          >
                            Confirm
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(doc.id)}
                            title="Delete"
                            className={cn(
                              "shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:bg-red-500/10",
                            )}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ))}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <DocModal
        doc={modal?.doc ?? null}
        category={modal?.category ?? ""}
        open={modal !== null}
        onOpenChange={(open) => !open && setModal(null)}
        onSave={handleSave}
      />
    </div>
  );
}
