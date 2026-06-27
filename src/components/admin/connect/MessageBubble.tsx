"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { FileText, ImageIcon } from "lucide-react";
import type { ConnectMessage } from "./hooks/useMessages";

interface Props {
  message: ConnectMessage;
  isOwn: boolean;
  /** First word of the current user's display name, lowercased — used to accent self-mentions. */
  selfSlug?: string | null;
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

/**
 * Renders message body text with @mention tokens highlighted.
 * Self-mentions (matching selfSlug) get an amber accent; others get a muted primary tint.
 */
function MentionText({ body, selfSlug, isOwn }: { body: string; selfSlug?: string | null; isOwn: boolean }) {
  const MENTION_RE = /@([A-Za-z0-9_.]+)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  MENTION_RE.lastIndex = 0;
  while ((match = MENTION_RE.exec(body)) !== null) {
    if (match.index > last) parts.push(body.slice(last, match.index));
    const token = match[1];
    const isSelf = !!selfSlug && token.toLowerCase() === selfSlug;
    parts.push(
      <span
        key={key++}
        className={cn(
          "rounded px-0.5 font-semibold",
          isSelf
            ? "bg-amber-400/30 text-amber-700 dark:text-amber-300"
            : isOwn
              ? "bg-white/20 text-white"
              : "bg-primary/15 text-primary",
        )}
      >
        @{token}
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < body.length) parts.push(body.slice(last));

  return <>{parts}</>;
}

function Attachment({ url, type, name }: { url: string; type: string | null; name: string | null }) {
  const label = name ?? "Attachment";
  const isImage = type === "image" || url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i);

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={label}
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

export function MessageBubble({ message, isOwn, selfSlug }: Props) {
  const { sender, body, attachmentUrl, attachmentType, attachmentName, createdAt, editedAt } = message;

  return (
    <div className={cn("flex items-end gap-2 group", isOwn && "flex-row-reverse")}>
      {!isOwn && <Avatar name={sender.name} image={sender.image} />}

      <div className={cn("flex flex-col max-w-[72%]", isOwn && "items-end")}>
        {!isOwn && (
          <span className="text-[10px] text-muted-foreground mb-0.5 ml-1">
            {sender.name ?? "Unknown"}
          </span>
        )}

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
              <MentionText body={body} selfSlug={selfSlug} isOwn={isOwn} />
            </p>
          )}
          {attachmentUrl && (
            <Attachment url={attachmentUrl} type={attachmentType} name={attachmentName} />
          )}
        </div>

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
