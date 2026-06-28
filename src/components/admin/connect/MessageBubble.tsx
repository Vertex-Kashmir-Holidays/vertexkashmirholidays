"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { FileText, ImageIcon, Pencil, Trash2, ImageOff } from "lucide-react";
import type { ConnectMessage } from "./hooks/useMessages";

interface Props {
  message: ConnectMessage;
  isOwn: boolean;
  /** First word of the current user's display name, lowercased — used to accent self-mentions. */
  selfSlug?: string | null;
  onEdit?: (message: ConnectMessage) => void;
  onDelete?: (messageId: string) => void;
}

function Avatar({ name, image }: { name: string | null; image: string | null }) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        width={28}
        height={28}
        className="rounded-full object-cover shrink-0 w-7 h-7"
      />
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
      {(name ?? "?").charAt(0).toUpperCase()}
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const URL_RE = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
const MENTION_RE = /@([A-Za-z0-9_.]+)/g;
const EMOJI_STRIP_RE = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}\u{1F3FB}-\u{1F3FF}\s]/gu;
const EMOJI_COUNT_RE = /\p{Extended_Pictographic}/gu;

function isEmojiOnly(text: string): boolean {
  const stripped = text.replace(EMOJI_STRIP_RE, "");
  return stripped.length === 0 && text.trim().length > 0;
}

function countEmoji(text: string): number {
  return (text.match(EMOJI_COUNT_RE) ?? []).length;
}

type Segment =
  | { type: "text"; value: string }
  | { type: "mention"; token: string; isSelf: boolean }
  | { type: "url"; href: string };

function RichText({ body, selfSlug, isOwn }: { body: string; selfSlug?: string | null; isOwn: boolean }) {
  const segments: Segment[] = [];

  // Collect all token matches with their positions
  const tokens: Array<{ index: number; end: number; segment: Segment }> = [];

  URL_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = URL_RE.exec(body)) !== null) {
    tokens.push({ index: m.index, end: m.index + m[0].length, segment: { type: "url", href: m[0] } });
  }

  MENTION_RE.lastIndex = 0;
  while ((m = MENTION_RE.exec(body)) !== null) {
    const token = m[1];
    const isSelf = !!selfSlug && token.toLowerCase() === selfSlug;
    tokens.push({ index: m.index, end: m.index + m[0].length, segment: { type: "mention", token, isSelf } });
  }

  // Sort by position, remove overlaps (first-wins)
  tokens.sort((a, b) => a.index - b.index);
  const deduped: typeof tokens = [];
  let lastEnd = 0;
  for (const t of tokens) {
    if (t.index >= lastEnd) {
      deduped.push(t);
      lastEnd = t.end;
    }
  }

  // Build segment list
  let cursor = 0;
  for (const { index, end, segment } of deduped) {
    if (index > cursor) segments.push({ type: "text", value: body.slice(cursor, index) });
    segments.push(segment);
    cursor = end;
  }
  if (cursor < body.length) segments.push({ type: "text", value: body.slice(cursor) });

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "text") return <React.Fragment key={i}>{seg.value}</React.Fragment>;
        if (seg.type === "url") {
          const display = seg.href.length > 45 ? seg.href.slice(0, 42) + "…" : seg.href;
          return (
            <a
              key={i}
              href={seg.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "underline underline-offset-2 break-all hover:opacity-80 transition-opacity",
                isOwn ? "text-primary-foreground/90" : "text-primary",
              )}
            >
              {display}
            </a>
          );
        }
        // mention
        return (
          <span
            key={i}
            className={cn(
              "rounded px-0.5 font-semibold",
              seg.isSelf
                ? "bg-amber-400/30 text-amber-700 dark:text-amber-300"
                : isOwn
                  ? "bg-white/20 text-white"
                  : "bg-primary/15 text-primary",
            )}
          >
            @{seg.token}
          </span>
        );
      })}
    </>
  );
}

function Attachment({ url, type, name }: { url: string; type: string | null; name: string | null }) {
  const [imgError, setImgError] = useState(false);
  const label = name ?? "Attachment";
  const isImage = type === "image" || !!url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i);

  if (isImage) {
    if (imgError) {
      return (
        <div className="flex items-center gap-2 mt-1.5 px-3 py-2 rounded-lg border border-border/50 bg-muted/30 text-muted-foreground max-w-[240px]">
          <ImageOff className="w-4 h-4 shrink-0" />
          <span className="text-xs italic">This media is not available</span>
        </div>
      );
    }
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={label}
          onError={() => setImgError(true)}
          className="max-w-[240px] max-h-[200px] rounded-lg object-cover border border-border"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 mt-1.5 px-3 py-2 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors text-sm max-w-[240px]"
    >
      {type === "pdf" ? (
        <FileText className="w-4 h-4 text-red-500 shrink-0" />
      ) : (
        <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
      )}
      <span className="truncate text-xs">{label}</span>
    </a>
  );
}

export function MessageBubble({ message, isOwn, selfSlug, onEdit, onDelete }: Props) {
  const { sender, body, attachmentUrl, attachmentType, attachmentName, createdAt, editedAt } = message;

  const emojiOnly = !!body && !attachmentUrl && isEmojiOnly(body);
  const emojiCount = emojiOnly ? countEmoji(body!) : 0;
  const emojiSizeClass = emojiCount <= 2 ? "text-5xl" : emojiCount <= 4 ? "text-4xl" : "text-3xl";

  if (message.deletedAt) {
    return (
      <div className={cn("flex items-end gap-2", isOwn && "flex-row-reverse")}>
        {!isOwn && <Avatar name={sender.name} image={sender.image} />}
        <div className={cn("flex flex-col max-w-[72%]", isOwn && "items-end")}>
          {!isOwn && (
            <span className="text-[10px] text-muted-foreground mb-0.5 ml-1">
              {sender.name ?? "Unknown"}
            </span>
          )}
          <div className="rounded-2xl px-3.5 py-2 text-sm text-muted-foreground italic bg-muted/50 border border-border/50">
            Message deleted
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-end gap-2 group", isOwn && "flex-row-reverse")}>
      {!isOwn && <Avatar name={sender.name} image={sender.image} />}

      {isOwn && (onEdit || onDelete) && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 self-end mb-1 shrink-0">
          {onEdit && body && (
            <button
              onClick={() => onEdit(message)}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Edit"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                if (confirm("Delete this message?")) onDelete(message.id);
              }}
              className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      <div className={cn("flex flex-col max-w-[72%]", isOwn && "items-end")}>
        {!isOwn && (
          <span className="text-[10px] text-muted-foreground mb-0.5 ml-1">
            {sender.name ?? "Unknown"}
          </span>
        )}

        {emojiOnly ? (
          <div className={cn("px-1 py-0.5 leading-none select-none", emojiSizeClass)}>
            {body}
          </div>
        ) : (
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words",
              isOwn
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm",
            )}
          >
            {body && (
              <p>
                <RichText body={body} selfSlug={selfSlug} isOwn={isOwn} />
              </p>
            )}
            {attachmentUrl && (
              <Attachment url={attachmentUrl} type={attachmentType} name={attachmentName} />
            )}
          </div>
        )}

        <div className={cn("flex items-center gap-1 mt-0.5 px-1", isOwn && "flex-row-reverse")}>
          <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {formatDate(createdAt)} {formatTime(createdAt)}
          </span>
          {editedAt && (
            <span className="text-[10px] text-muted-foreground italic opacity-0 group-hover:opacity-100 transition-opacity">
              edited
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
