"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/organisms/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Agents ticked in the list (any status). */
  selected: { id: string; label: string }[];
  /** How many agents are ACTIVE — the audience for "all". */
  activeCount: number;
}

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

/**
 * Compose an information email to B2B agents — every active agent, or just the
 * ones ticked in the list (POST /api/admin/b2b-agents/email). Each agent gets
 * their own copy in the standard branded template, addressed by name.
 */
export function EmailB2bAgentsDialog({ open, onOpenChange, selected, activeCount }: Props) {
  const [audience, setAudience] = useState<"all" | "selected">("all");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Opening with agents ticked defaults to those; otherwise to everyone.
  useEffect(() => {
    if (open) setAudience(selected.length > 0 ? "selected" : "all");
  }, [open, selected.length]);

  const count = audience === "selected" ? selected.length : activeCount;
  const canSend = !sending && count > 0 && subject.trim().length >= 3 && message.trim().length >= 10;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/b2b-agents/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(audience === "selected" ? { agentIds: selected.map((s) => s.id) } : {}),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        sent?: number;
        failed?: number;
      };
      if (!res.ok) throw new Error(json.error ?? "Could not send the email.");
      if (json.failed) {
        toast.warning(`Sent to ${json.sent} agent(s); ${json.failed} could not be delivered.`);
      } else {
        toast.success(`Email sent to ${json.sent} agent${json.sent === 1 ? "" : "s"}.`);
      }
      setSubject("");
      setMessage("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !sending && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email B2B agents</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Each agent gets their own copy, addressed by name, in the standard Vertex email template.
          Agents never see who else received it.
        </DialogDescription>

        <form onSubmit={send} className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Send to
            </legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="audience"
                checked={audience === "all"}
                onChange={() => setAudience("all")}
              />
              All active agents ({activeCount})
            </label>
            <label
              className={`flex items-start gap-2 text-sm ${selected.length === 0 ? "text-muted-foreground" : ""}`}
            >
              <input
                type="radio"
                name="audience"
                className="mt-1"
                disabled={selected.length === 0}
                checked={audience === "selected"}
                onChange={() => setAudience("selected")}
              />
              <span>
                Selected agents ({selected.length})
                {selected.length === 0 ? (
                  <span className="block text-xs">Tick agents in the list to send to just them.</span>
                ) : (
                  <span className="block text-xs text-muted-foreground">
                    {selected
                      .slice(0, 6)
                      .map((s) => s.label)
                      .join(", ")}
                    {selected.length > 6 ? ` and ${selected.length - 6} more` : ""}
                  </span>
                )}
              </span>
            </label>
          </fieldset>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Subject
            </span>
            <input
              className={inputCls + " mt-1"}
              value={subject}
              maxLength={150}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Winter 2026 rates are now available"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Message
            </span>
            <textarea
              className={inputCls + " mt-1"}
              rows={8}
              maxLength={5000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                "Write the message. Leave a blank line between paragraphs.\n\nThe email opens with “Dear <agent's name>,” and closes with the B2B Partnerships Team sign-off, so you don't need to add either."
              }
            />
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={sending}
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSend}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send to {count} agent{count === 1 ? "" : "s"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
