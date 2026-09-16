"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/organisms/dialog";
import type { DocLinkItem } from "./DocLinksSection";

interface Props {
  link: DocLinkItem | null; // null = create mode
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: { title: string; url: string; purpose: string }) => Promise<boolean>;
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-card";
const labelCls = "block text-xs font-bold text-muted-foreground mb-1.5";

export function DocLinkModal({ link, open, onOpenChange, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [purpose, setPurpose] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset to the link's current saved state every time the modal opens.
  useEffect(() => {
    if (!open) return;
    setTitle(link?.title ?? "");
    setUrl(link?.url ?? "");
    setPurpose(link?.purpose ?? "");
    setError(null);
  }, [open, link]);

  async function handleSave() {
    if (!title.trim()) return setError("Title is required.");
    if (!url.trim()) return setError("Link is required.");
    if (!purpose.trim()) return setError("Purpose is required.");

    setError(null);
    setSaving(true);
    const ok = await onSave({ title: title.trim(), url: url.trim(), purpose: purpose.trim() });
    setSaving(false);
    if (ok) onOpenChange(false);
    else setError("Save failed — please check the link is a valid URL and try again.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{link ? "Edit Link" : "Add Link"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <label className={labelCls}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              placeholder="e.g. Budget Rate Card"
            />
          </div>
          <div>
            <label className={labelCls}>Link</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputCls}
              placeholder="https://…"
              type="url"
            />
          </div>
          <div>
            <label className={labelCls}>Purpose</label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={3}
              className={inputCls}
              placeholder="What this link is for and when to use it"
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
            {link ? "Save Changes" : "Add Link"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
