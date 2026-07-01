"use client";
import { useRef, useState, useEffect, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { Paperclip, Pencil, Send, Smile, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConnectMessage } from "./hooks/useMessages";
import { EmojiPicker } from "./EmojiPicker";

const MAX_BYTES = 1 * 1024 * 1024; // 1 MB

export interface SendingPayload {
  tempId: string;
  body: string | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  attachmentName: string | null;
}

interface Props {
  roomId: string;
  disabled?: boolean;
  onSending?: (payload: SendingPayload) => void;
  onSent: (message: unknown, tempId: string) => void;
  onSendFailed?: (tempId: string) => void;
  editingMessage?: ConnectMessage | null;
  onCancelEdit?: () => void;
  onEdited?: (message: unknown) => void;
}

interface UploadResult {
  url: string;
  publicId: string | null;
}

export function MessageInput({ roomId, disabled, onSending, onSent, onSendFailed, editingMessage, onCancelEdit, onEdited }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachment, setAttachment] = useState<{
    url: string;
    publicId: string | null;
    name: string;
    type: string;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-resize textarea to content height
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [text]);

  // Pre-fill textarea when entering edit mode
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.body ?? "");
      textareaRef.current?.focus();
    } else {
      setText("");
    }
  }, [editingMessage]);

  async function handleFile(file: File) {
    if (file.size > MAX_BYTES) {
      toast.error("File too large", { description: `"${file.name}" exceeds the 1 MB limit.` });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "connect");
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as UploadResult;
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const attachType =
        file.type.startsWith("image/") ? "image"
        : ext === "pdf" ? "pdf"
        : "file";
      setAttachment({ url: data.url, publicId: data.publicId ?? null, name: file.name, type: attachType });
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function insertEmoji(emoji: string) {
    const ta = textareaRef.current;
    if (!ta) {
      setText((prev) => prev + emoji);
      return;
    }
    const start = ta.selectionStart ?? text.length;
    const end = ta.selectionEnd ?? text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    // Restore cursor after emoji
    requestAnimationFrame(() => {
      ta.selectionStart = start + emoji.length;
      ta.selectionEnd = start + emoji.length;
      ta.focus();
    });
    setShowEmoji(false);
  }

  async function send() {
    const trimmed = text.trim();

    if (editingMessage) {
      if (!trimmed) return;
      setSending(true);
      try {
        const res = await fetch(`/api/connect/rooms/${roomId}/messages/${editingMessage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: trimmed }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(data.error ?? "Edit failed");
        }
        const msg = await res.json();
        onEdited?.(msg);
        setText("");
        onCancelEdit?.();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to edit message.");
      } finally {
        setSending(false);
      }
      return;
    }

    if (!trimmed && !attachment) return;

    // Optimistic: show message immediately without blocking the textarea
    const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    onSending?.({
      tempId,
      body: trimmed || null,
      attachmentUrl: attachment?.url ?? null,
      attachmentType: attachment?.type ?? null,
      attachmentName: attachment?.name ?? null,
    });
    setText("");
    setAttachment(null);
    textareaRef.current?.focus();

    setSending(true); // only disables the send button, not the textarea
    try {
      const res = await fetch(`/api/connect/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: trimmed || undefined,
          attachmentUrl: attachment?.url,
          attachmentPublicId: attachment?.publicId,
          attachmentType: attachment?.type,
          attachmentName: attachment?.name,
        }),
      });
      if (!res.ok) throw new Error("Send failed");
      const msg = await res.json();
      onSent(msg, tempId);
    } catch {
      onSendFailed?.(tempId);
      toast.error("Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
    if (e.key === "Escape" && editingMessage) {
      onCancelEdit?.();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    if (e.target.value && !editingMessage) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        fetch(`/api/connect/rooms/${roomId}/typing`, { method: "POST" }).catch(() => {});
      }, 500);
    }
  }

  const busy = uploading || disabled; // "sending" no longer blocks the textarea

  return (
    <div className="relative">
      {showEmoji && (
        <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />
      )}
      <div className="p-3 border-t border-border bg-background">
      {editingMessage && (
        <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs">
          <Pencil className="w-3 h-3 text-primary shrink-0" />
          <span className="flex-1 text-primary">Editing message</span>
          <button onClick={onCancelEdit} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {attachment && !editingMessage && (
        <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm">
          <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="truncate flex-1 text-xs">{attachment.name}</span>
          <button
            onClick={() => setAttachment(null)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {!editingMessage && (
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0",
              busy && "opacity-50 cursor-not-allowed",
            )}
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
        )}
        {!editingMessage && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowEmoji((v) => !v)}
            className={cn(
              "p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0",
              busy && "opacity-50 cursor-not-allowed",
              showEmoji && "text-foreground bg-muted",
            )}
            title="Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          disabled={busy}
          placeholder={editingMessage ? "Edit message… (Esc to cancel)" : "Message… (Enter to send, Shift+Enter for new line)"}
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30",
            "overflow-y-auto",
            busy && "opacity-50 cursor-not-allowed",
          )}
          style={{ minHeight: 40, maxHeight: 200 }}
        />

        <button
          type="button"
          disabled={busy || (!text.trim() && !attachment && !editingMessage)}
          onClick={send}
          className={cn(
            "p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0",
            (busy || (!text.trim() && !attachment && !editingMessage)) && "opacity-50 cursor-not-allowed",
          )}
          title={editingMessage ? "Save edit" : "Send"}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      </div>
    </div>
  );
}
