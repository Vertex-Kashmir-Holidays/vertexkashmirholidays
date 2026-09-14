"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Trash2, Loader2, FileText, Download, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOC_CATEGORIES, type DocCategory } from "@/lib/docs/categories";

// Mirrors the server's authoritative check (src/app/api/admin/docs/route.ts) —
// this one is UX only, so a rejected file never even reaches the network.
const MAX_DOC_BYTES = 1 * 1024 * 1024; // 1 MB
const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

interface DocItem {
  id: string;
  title: string;
  category: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByName: string;
  createdAt: Date | string;
}

interface Props {
  initialItems: DocItem[];
  canCreate: boolean;
  canDelete: boolean;
}

function titleFromFilename(name: string): string {
  return name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim() || name;
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
  "B2B Payment Policy": "Payment terms shared with B2B agents.",
  "B2B Itinerary Sample": "Sample itineraries used to pitch B2B agents.",
  General: "Anything else worth keeping here for staff to find and share.",
};

export function DocsClient({ initialItems, canCreate, canDelete }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadingCategory, setUploadingCategory] = useState<DocCategory | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputs = useRef<Partial<Record<DocCategory, HTMLInputElement | null>>>({});

  function triggerUpload(category: DocCategory) {
    fileInputs.current[category]?.click();
  }

  async function handleFileSelected(category: DocCategory, file: File | undefined) {
    if (!file) return;
    if (!ALLOWED_DOC_TYPES.includes(file.type)) {
      toast.error("File must be a PDF, DOC, DOCX, PNG, or JPG.");
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      toast.error("File is too large — maximum size is 1 MB.");
      return;
    }

    setUploadingCategory(category);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", titleFromFilename(file.name));
      fd.append("category", category);
      const res = await fetch("/api/admin/docs", { method: "POST", body: fd });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        toast.error(error || "Upload failed.");
        return;
      }
      toast.success("Document uploaded.");
      router.refresh();
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploadingCategory(null);
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
          Reference documents for staff to view, download, and share — company profile, B2B
          policy, and itinerary samples.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {DOC_CATEGORIES.map((category) => {
          const items = initialItems.filter((i) => i.category === category);
          const uploading = uploadingCategory === category;
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
                    onClick={() => triggerUpload(category)}
                    disabled={uploading}
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-primary border border-border px-3 py-1.5 rounded-lg hover:bg-primary/10 disabled:opacity-60"
                  >
                    {uploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Upload
                  </button>
                )}
                <input
                  ref={(el) => {
                    fileInputs.current[category] = el;
                  }}
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    handleFileSelected(category, e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
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
                        <p className="text-sm font-semibold text-foreground truncate">
                          {doc.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {fmtSize(doc.sizeBytes)} · {doc.uploadedByName} · {fmtDate(doc.createdAt)}
                        </p>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Download"
                        className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
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
    </div>
  );
}
