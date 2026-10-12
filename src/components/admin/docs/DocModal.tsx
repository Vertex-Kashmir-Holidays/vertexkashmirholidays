"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/organisms/dialog";

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

export interface DocMetaPayload {
  title: string;
  description: string;
  /** Set in create mode only — editing changes the title/purpose, not the file. */
  file?: File;
}

interface Props {
  /** null = upload a new document into `category`. */
  doc: { title: string; description: string } | null;
  category: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: DocMetaPayload) => Promise<boolean>;
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-card";
const labelCls = "block text-xs font-bold text-muted-foreground mb-1.5";

function titleFromFilename(name: string): string {
  return name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim() || name;
}

// Same look and flow as DocLinkModal — B2B agents see the title and purpose
// on their account, so both are asked for up front instead of reusing the
// file name.
export function DocModal({ doc, category, open, onOpenChange, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset to the document's current saved state every time the modal opens.
  useEffect(() => {
    if (!open) return;
    setTitle(doc?.title ?? "");
    setDescription(doc?.description ?? "");
    setFile(null);
    setError(null);
  }, [open, doc]);

  function handleFile(f: File | undefined) {
    if (!f) return;
    if (!ALLOWED_DOC_TYPES.includes(f.type)) return setError("File must be a PDF, DOC, DOCX, PNG, or JPG.");
    if (f.size > MAX_DOC_BYTES) return setError("File is too large — maximum size is 1 MB.");
    setError(null);
    setFile(f);
    // A starting point only — staff should rewrite it into a readable title.
    if (!title.trim()) setTitle(titleFromFilename(f.name));
  }

  async function handleSave() {
    if (!doc && !file) return setError("Please choose a file.");
    if (!title.trim()) return setError("Title is required.");

    setError(null);
    setSaving(true);
    const ok = await onSave({
      title: title.trim(),
      description: description.trim(),
      ...(file ? { file } : {}),
    });
    setSaving(false);
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{doc ? "Edit Document" : `Upload to ${category}`}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {!doc && (
            <div>
              <label className={labelCls}>File (PDF, DOC, DOCX, PNG or JPG · max 1 MB)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary"
              />
            </div>
          )}
          <div>
            <label className={labelCls}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className={inputCls}
              placeholder="e.g. B2B Rate Card — Oct 2026 to Feb 2027"
            />
          </div>
          <div>
            <label className={labelCls}>What it&apos;s for (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              rows={2}
              className={inputCls}
              placeholder="e.g. Per-room hotel and vehicle rates for quoting your customers"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="text-sm font-bold text-muted-foreground hover:text-foreground px-4 py-2 rounded-xl border border-border transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {doc ? "Save Changes" : "Upload"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
