"use client";
import { useRef, useState, type KeyboardEvent } from "react";
import { Paperclip, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_BYTES = 1 * 1024 * 1024; // 1 MB

interface Props {
  roomId: string;
  disabled?: boolean;
  onSent: (message: unknown) => void;
}

interface UploadResult {
  url: string;
  publicId: string | null;
}

export function MessageInput({ roomId, disabled, onSent }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState<{
    url: string;
    publicId: string | null;
    name: string;
    type: string;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleFile(file: File) {
    if (file.size > MAX_BYTES) {
      alert(`Attachments are limited to 1 MB. "${file.name}" is too large.`);
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
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function send() {
    const trimmed = text.trim();
    if (!trimmed && !attachment) return;
    setSending(true);
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
      onSent(msg);
      setText("");
      setAttachment(null);
      textareaRef.current?.focus();
    } catch {
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const busy = sending || uploading || disabled;

  return (
    <div className="p-3 border-t border-border bg-background">
      {attachment && (
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

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={busy}
          placeholder="Message… (Enter to send, Shift+Enter for new line)"
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30",
            "max-h-32 overflow-y-auto",
            busy && "opacity-50 cursor-not-allowed",
          )}
          style={{ minHeight: 40 }}
        />

        <button
          type="button"
          disabled={busy || (!text.trim() && !attachment)}
          onClick={send}
          className={cn(
            "p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0",
            (busy || (!text.trim() && !attachment)) && "opacity-50 cursor-not-allowed",
          )}
          title="Send"
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
  );
}
