"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { FileText, ImageIcon, Pencil, Trash2, ImageOff, Clock, Check, CheckCheck } from "lucide-react";
import type { ConnectMessage } from "./hooks/useMessages";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👎"] as const;

interface Props {
  message: ConnectMessage;
  isOwn: boolean;
  /** First word of the current user's display name, lowercased — used to accent self-mentions. */
  selfSlug?: string | null;
  /** ms timestamp — any other member's lastReadAt. Used to show ✓✓ on own messages. */
  readUpTo?: number;
  currentUserId?: string;
  /** False when the previous message is from the same sender (no date divider between them).
      Hides the avatar and sender name to group consecutive messages visually. */
  isFirstInGroup?: boolean;
  onReact?: (messageId: string, emoji: string) => void;
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
        if (seg.type === "text") {
          const lines = seg.value.split("\n");
          return (
            <React.Fragment key={i}>
              {lines.map((line, j) => (
                <React.Fragment key={j}>
                  {j > 0 && <br />}
                  {line}
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        }
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

// isOwn=true → renders inside a primary-coloured bubble; use foreground-relative colours.
function MessageStatus({ message, readUpTo, isOwn = false }: { message: ConnectMessage; readUpTo: number; isOwn?: boolean }) {
  if (message._status === "sending") {
    return <Clock className={cn("w-3 h-3 shrink-0", isOwn ? "text-primary-foreground/50" : "text-muted-foreground/60")} />;
  }
  const msgTime = new Date(message.createdAt).getTime();
  if (readUpTo > 0 && readUpTo >= msgTime) {
    return <CheckCheck className={cn("w-3.5 h-3.5 shrink-0", isOwn ? "text-sky-200" : "text-sky-500")} />;
  }
  return <Check className={cn("w-3 h-3 shrink-0", isOwn ? "text-primary-foreground/60" : "text-muted-foreground/60")} />;
}

export function MessageBubble({ message, isOwn, selfSlug, readUpTo = 0, currentUserId = "", isFirstInGroup = true, onReact, onEdit, onDelete }: Props) {
  const { sender, body, attachmentUrl, attachmentType, attachmentName, createdAt, editedAt } = message;

  if (message.isSystem) {
    const isMissed = body?.toLowerCase().includes("missed");
    return (
      <div className="flex items-center gap-2 py-1 px-2">
        <div className="flex-1 h-px bg-border/50" />
        <span className={cn(
          "text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
          isMissed
            ? "text-red-500 dark:text-red-400 bg-red-500/10"
            : "text-muted-foreground bg-muted/60",
        )}>
          {isMissed ? "📞 " : ""}{body}
        </span>
        <div className="flex-1 h-px bg-border/50" />
      </div>
    );
  }

  const emojiOnly = !!body && !attachmentUrl && isEmojiOnly(body);
  const emojiCount = emojiOnly ? countEmoji(body!) : 0;
  const emojiSizeClass = emojiCount <= 2 ? "text-5xl" : emojiCount <= 4 ? "text-4xl" : "text-3xl";

  if (message.deletedAt) {
    return (
      <div className={cn("flex items-center gap-2", isOwn && "flex-row-reverse")}>
        {!isOwn && (
          isFirstInGroup
            ? <Avatar name={sender.name} image={sender.image} />
            : <div className="w-7 shrink-0" />
        )}
        <div className={cn("flex flex-col max-w-[72%]", isOwn && "items-end")}>
          {!isOwn && isFirstInGroup && (
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

  // Parse reactions once — used for both pills and the quick-react bar highlights
  const reactionMap: Record<string, string[]> = (() => {
    try { return message.reactions ? (JSON.parse(message.reactions) as Record<string, string[]>) : {}; }
    catch { return {}; }
  })();
  const reactionEntries = Object.entries(reactionMap).filter(([, users]) => users.length > 0);

  return (
    <div className={cn("flex items-center gap-2", isOwn && "flex-row-reverse")}>
      {!isOwn && (
        isFirstInGroup
          ? <Avatar name={sender.name} image={sender.image} />
          : <div className="w-7 shrink-0" /> /* spacer keeps bubble indent consistent */
      )}

      {/*
        'group' is on the COLUMN, not the outer row.
        Hover zone = bubble width only, not the full chat width.
      */}
      <div className={cn("group flex flex-col max-w-[72%]", isOwn && "items-end")}>
        {!isOwn && isFirstInGroup && (
          <span className="text-[10px] text-muted-foreground mb-0.5 ml-1">
            {sender.name ?? "Unknown"}
          </span>
        )}

        {/* Bubble + absolute controls + superscript reaction pills */}
        <div className="relative">
          {emojiOnly ? (
            /* Emoji-only: same inline flex layout as text — emoji + time on one baseline-bottom row */
            <div className="flex items-end gap-x-1.5 px-1 py-0.5 select-none">
              <span className={cn("leading-none", emojiSizeClass)}>{body}</span>
              <span className="flex-none inline-flex items-baseline gap-0.5 leading-none whitespace-nowrap pb-0.5">
                {editedAt && (
                  <span className="text-[10px] italic text-muted-foreground/60">edited·</span>
                )}
                <span className="text-[10px] text-muted-foreground/70">{formatTime(createdAt)}</span>
                {isOwn && !message.deletedAt && <MessageStatus message={message} readUpTo={readUpTo} />}
              </span>
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
                /* flex items-end: text wraps in flex-1, time stays flex-none at the right,
                   both bottom-edges aligned so time baseline sits at the last text line bottom */
                <p className="flex items-end gap-x-2 leading-relaxed">
                  <span className="flex-1 min-w-0 break-words">
                    <RichText body={body} selfSlug={selfSlug} isOwn={isOwn} />
                  </span>
                  {!attachmentUrl && (
                    <span className="flex-none inline-flex items-baseline gap-0.5 leading-none select-none whitespace-nowrap">
                      {editedAt && (
                        <span className={cn("text-[10px] italic", isOwn ? "text-primary-foreground/50" : "text-foreground/40")}>
                          edited·
                        </span>
                      )}
                      <span className={cn("text-[10px]", isOwn ? "text-primary-foreground/60" : "text-foreground/50")}>
                        {formatTime(createdAt)}
                      </span>
                      {isOwn && !message.deletedAt && (
                        <MessageStatus message={message} readUpTo={readUpTo} isOwn />
                      )}
                    </span>
                  )}
                </p>
              )}
              {attachmentUrl && (
                <>
                  <Attachment url={attachmentUrl} type={attachmentType} name={attachmentName} />
                  {/* Time below attachment (covers both attachment-only and body+attachment) */}
                  <div className="flex justify-end items-baseline gap-0.5 mt-1 leading-none select-none">
                    {editedAt && (
                      <span className={cn("text-[10px] italic", isOwn ? "text-primary-foreground/50" : "text-foreground/40")}>edited·</span>
                    )}
                    <span className={cn("text-[10px]", isOwn ? "text-primary-foreground/60" : "text-foreground/50")}>
                      {formatTime(createdAt)}
                    </span>
                    {isOwn && !message.deletedAt && (
                      <MessageStatus message={message} readUpTo={readUpTo} isOwn />
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Reaction pills — superscript at bubble bottom corner, always at same position.
              Own/sender  → bottom-LEFT  (start side)
              Other/recv  → bottom-RIGHT (end side)               */}
          {reactionEntries.length > 0 && (
            <div
              className={cn(
                "absolute -bottom-3 z-10 flex items-center gap-0.5",
                isOwn ? "left-1.5" : "right-1.5",
              )}
            >
              {reactionEntries.map(([emoji, users]) => (
                <button
                  key={emoji}
                  onClick={() => onReact?.(message.id, emoji)}
                  className={cn(
                    "flex items-center gap-0.5 text-[11px] leading-none px-1.5 py-0.5 rounded-full border bg-background shadow-sm transition-colors",
                    users.includes(currentUserId)
                      ? "border-primary/50 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/50",
                  )}
                  title={users.includes(currentUserId) ? "Remove reaction" : "React"}
                >
                  {emoji}{users.length > 1 && <span className="font-semibold ml-0.5">{users.length}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Controls — absolute, always at the same position below the bubble.
              opacity-0 / opacity-100 via group-hover so layout never shifts.
              pointer-events-none until visible so invisible bar isn't accidentally clicked. */}
          <div
            className={cn(
              "absolute top-full pt-1 z-20 flex items-center gap-1",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "pointer-events-none group-hover:pointer-events-auto",
              isOwn ? "right-0" : "left-0",
            )}
          >
            {onReact && (
              <div className="flex items-center gap-0.5 bg-background border border-border rounded-full shadow-sm px-1 py-0.5">
                {QUICK_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => onReact(message.id, e)}
                    className={cn(
                      "w-6 h-6 flex items-center justify-center rounded-full text-sm leading-none transition-colors",
                      reactionMap[e]?.includes(currentUserId) ? "bg-primary/15" : "hover:bg-muted",
                    )}
                    title={reactionMap[e]?.includes(currentUserId) ? `Remove ${e}` : `React ${e}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
            {isOwn && (onEdit || onDelete) && (
              <div className="flex items-center gap-0.5 bg-background border border-border rounded-full shadow-sm px-1 py-0.5">
                {onEdit && body && (
                  <button
                    onClick={() => onEdit(message)}
                    className="w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(message.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
