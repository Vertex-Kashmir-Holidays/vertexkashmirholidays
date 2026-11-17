"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FileText, FolderOpen, Loader2, Trash2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/organisms/dialog";
import { ConfirmDialog } from "@/components/admin/connect/ConfirmDialog";
import { docDownloadFilename } from "@/lib/docs/categories";

interface AgentDoc {
  id: string;
  title: string;
  description: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByName: string;
  createdAt: string;
}

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

/**
 * Admin → B2B Agents → (agent) → Documents: share a proposal or any other
 * document with this one agent. It shows in their portal's Documents panel;
 * staff choose whether to also email them about it.
 */
export function AgentDocumentsButton({
  agentId,
  agentLabel,
  agentEmail,
  agentActive,
}: {
  agentId: string;
  agentLabel: string;
  agentEmail: string;
  /** Only an ACTIVE agent can sign in, so only they can be emailed. */
  agentActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [docs, setDocs] = useState<AgentDoc[] | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sendEmail, setSendEmail] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AgentDoc | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    fetch(`/api/admin/b2b-agents/${agentId}/documents`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: AgentDoc[]) => setDocs(d))
      .catch(() => toast.error("Couldn't load documents."));
  }, [agentId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  function reset() {
    setTitle("");
    setDescription("");
    setFile(null);
    setSendEmail(true);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function upload() {
    if (!file) return void toast.error("Choose a file to upload.");
    if (!title.trim()) return void toast.error("Give the document a title.");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("sendEmail", String(agentActive && sendEmail));
      const res = await fetch(`/api/admin/b2b-agents/${agentId}/documents`, { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as { error?: string; emailed?: boolean; requestedEmail?: boolean };
      if (!res.ok) throw new Error(json.error ?? "Upload failed.");
      if (json.requestedEmail && !json.emailed) {
        toast.warning("Document shared, but the email to the agent could not be sent.");
      } else {
        toast.success(json.emailed ? `Document shared and ${agentEmail} emailed.` : "Document shared with the agent.");
      }
      reset();
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function remove(doc: AgentDoc) {
    setConfirmDelete(null);
    const res = await fetch(`/api/admin/b2b-agents/${agentId}/documents/${doc.id}`, { method: "DELETE" });
    if (!res.ok) return void toast.error("Couldn't delete the document.");
    toast.success("Document removed from the agent's portal.");
    load();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground transition hover:bg-muted"
      >
        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        Documents
      </button>

      <Dialog open={open} onOpenChange={(o) => !uploading && setOpen(o)}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Documents for {agentLabel}</DialogTitle>
            <DialogDescription>
              Shared with this agent only — they see them in the Documents panel of their partner account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-xl border border-border p-4">
            <div>
              <label htmlFor="agent-doc-title" className="mb-1 block text-xs font-semibold text-muted-foreground">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="agent-doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="e.g. Proposal — Kashmir 5N/6D for Mr Sharma"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="agent-doc-desc" className="mb-1 block text-xs font-semibold text-muted-foreground">
                Note for the agent
              </label>
              <input
                id="agent-doc-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                placeholder="Optional — what it is or what to do with it"
                className={inputCls}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border px-3 py-3 transition hover:border-primary hover:bg-primary/5">
              <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {file ? file.name : "Choose file — PDF, DOC, DOCX, PNG or JPG (max 1 MB)"}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <label className={`flex items-start gap-2 text-sm ${agentActive ? "cursor-pointer" : "opacity-60"}`}>
              <input
                type="checkbox"
                checked={agentActive && sendEmail}
                disabled={!agentActive}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span>
                <span className="font-semibold text-foreground">Email the agent about this document</span>
                <span className="block text-[12px] text-muted-foreground">
                  {agentActive
                    ? `Sends a short note to ${agentEmail} with a link to their partner account. Untick to share it silently.`
                    : "Only active agents can sign in — approve the agent first to email them."}
                </span>
              </span>
            </label>
            <button
              type="button"
              onClick={upload}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              {agentActive && sendEmail ? "Share & email agent" : "Share document"}
            </button>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Shared so far</h4>
            {docs === null ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : docs.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-6 text-center">
                <FolderOpen className="h-6 w-6 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">Nothing shared with this agent yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-start gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold text-foreground">{d.title}</p>
                      {d.description && <p className="break-words text-[12px] text-muted-foreground">{d.description}</p>}
                      <p className="text-[11px] text-muted-foreground">
                        {fmtDate(d.createdAt)} · by {d.uploadedByName}
                      </p>
                    </div>
                    <a
                      href={`/api/docs/${d.id}/download`}
                      download={docDownloadFilename(d.title, d.mimeType)}
                      aria-label={`Download ${d.title}`}
                      className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(d)}
                      aria-label={`Delete ${d.title}`}
                      className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Remove this document?"
        description={confirmDelete ? `"${confirmDelete.title}" will disappear from ${agentLabel}'s partner account.` : undefined}
        confirmLabel="Remove"
        destructive
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  );
}
