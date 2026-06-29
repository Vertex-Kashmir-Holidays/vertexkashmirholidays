"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, Users, Info, Phone, Video, Loader2, Search, Archive, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessages } from "./hooks/useMessages";
import { useNotificationSound } from "./hooks/useNotificationSound";
import type { ConnectRoom } from "./hooks/useRoomList";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { GroupInfoPanel } from "./GroupInfoPanel";
import { ActiveMeetingBanner } from "./ActiveMeetingBanner";
import { MeetingModal } from "./MeetingModal";
import { ConfirmDialog } from "./ConfirmDialog";
import type { ConnectMessage } from "./hooks/useMessages";
import type { ActiveMeeting } from "./ActiveMeetingBanner";
import type { PresenceMap, PresenceStatus } from "./hooks/usePresence";

interface StaffUser {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
}

const PRESENCE_COLORS: Record<PresenceStatus, string> = {
  ONLINE:  "bg-green-500",
  AWAY:    "bg-amber-400",
  BUSY:    "bg-red-500",
  OFFLINE: "bg-zinc-400",
};

const PRESENCE_LABELS: Record<PresenceStatus, string> = {
  ONLINE:  "Active now",
  AWAY:    "Away",
  BUSY:    "Busy",
  OFFLINE: "Offline",
};

interface Props {
  room: ConnectRoom;
  currentUserId: string;
  staffUsers: StaffUser[];
  presenceMap?: PresenceMap;
  onBack?: () => void;
  onRefresh?: () => Promise<void>;
}

interface OpenMeeting {
  id: string;
  jitsiRoomId: string;
  audioOnly: boolean;
  isCreator: boolean;
}

function roomTitle(room: ConnectRoom, currentUserId: string): string {
  if (room.type === "GROUP") return room.name ?? "Group";
  const other = room.members.find((m) => m.userId !== currentUserId);
  return other?.user.name ?? "Direct message";
}

function roomSubtitle(room: ConnectRoom, currentUserId: string): string {
  if (room.type === "GROUP") {
    const names = room.members
      .filter((m) => m.userId !== currentUserId)
      .map((m) => m.user.name ?? "?")
      .slice(0, 3)
      .join(", ");
    return names || "Group";
  }
  return "Direct message";
}

function DateDivider({ iso }: { iso: string }) {
  const label = new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return (
    <div className="flex items-center gap-3 py-2 px-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] text-muted-foreground font-medium shrink-0">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function sameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function ChatView({ room, currentUserId, staffUsers, presenceMap, onBack, onRefresh }: Props) {
  const { messages, loading, hasMore, loadMore, appendOptimistic, replaceOptimistic, updateMessage, removeMessage, typing } = useMessages(room.id);
  const { playMention } = useNotificationSound();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [openMeeting, setOpenMeeting] = useState<OpenMeeting | null>(null);
  const [startingMeeting, setStartingMeeting] = useState<"AUDIO" | "VIDEO" | null>(null);
  const [meetingError, setMeetingError] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<ConnectMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ConnectMessage[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteChatConfirm, setShowDeleteChatConfirm] = useState(false);

  const currentUserName =
    room.members.find((m) => m.userId === currentUserId)?.user.name ?? null;
  const selfSlug = currentUserName
    ? currentUserName.trim().split(/\s+/)[0].toLowerCase()
    : null;

  // Mark room as read on mount + whenever room changes
  useEffect(() => {
    fetch(`/api/connect/rooms/${room.id}/read`, { method: "POST" }).catch(() => {});
  }, [room.id]);

  // Scroll to bottom + mention sound when new messages arrive
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const prevLen = prevLengthRef.current;
    prevLengthRef.current = messages.length;
    if (messages.length === 0) return;

    if (prevLen === 0) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    } else if (messages.length > prevLen) {
      // Check if any new incoming message @mentions the current user
      const newMsgs = messages.slice(prevLen);
      const hasMention =
        !!selfSlug &&
        newMsgs.some(
          (m) => m.senderId !== currentUserId && m.body?.toLowerCase().includes(`@${selfSlug}`),
        );
      if (hasMention) playMention();

      const distFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distFromBottom < 200) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages, selfSlug, currentUserId, playMention]);

  // Compute the latest timestamp at which any OTHER member has read (for ✓✓ receipts)
  const readUpTo = Math.max(
    0,
    ...room.members
      .filter((m) => m.userId !== currentUserId && m.lastReadAt)
      .map((m) => new Date(m.lastReadAt!).getTime()),
  );

  const currentUserMember = room.members.find((m) => m.userId === currentUserId);

  function handleSending({ tempId, body, attachmentUrl, attachmentType, attachmentName }: import("./MessageInput").SendingPayload) {
    appendOptimistic({
      id: tempId,
      roomId: room.id,
      senderId: currentUserId,
      sender: {
        id: currentUserId,
        name: currentUserMember?.user.name ?? null,
        image: currentUserMember?.user.image ?? null,
      },
      body,
      attachmentUrl,
      attachmentPublicId: null,
      attachmentType,
      attachmentName,
      editedAt: null,
      deletedAt: null,
      reactions: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _status: "sending",
    });
  }

  function handleSent(msg: unknown, tempId: string) {
    replaceOptimistic(tempId, { ...(msg as ConnectMessage), _status: "sent" });
    fetch(`/api/connect/rooms/${room.id}/read`, { method: "POST" }).catch(() => {});
  }

  function handleSendFailed(tempId: string) {
    removeMessage(tempId);
  }

  async function handleReact(messageId: string, emoji: string) {
    // Optimistic: compute new reactions locally then confirm with server
    const prev = messages.find((m) => m.id === messageId);
    if (!prev) return;

    const map: Record<string, string[]> = (() => {
      try { return prev.reactions ? (JSON.parse(prev.reactions) as Record<string, string[]>) : {}; }
      catch { return {}; }
    })();

    // Remove any existing reaction from this user
    let oldEmoji: string | null = null;
    for (const [e, users] of Object.entries(map)) {
      if (users.includes(currentUserId)) { oldEmoji = e; break; }
    }
    if (oldEmoji) {
      map[oldEmoji] = map[oldEmoji].filter((u) => u !== currentUserId);
      if (map[oldEmoji].length === 0) delete map[oldEmoji];
    }
    if (oldEmoji !== emoji) {
      map[emoji] = [...(map[emoji] ?? []), currentUserId];
    }

    updateMessage({ ...prev, reactions: Object.keys(map).length ? JSON.stringify(map) : null });

    const res = await fetch(
      `/api/connect/rooms/${room.id}/messages/${messageId}/react`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emoji }) },
    );
    if (res.ok) {
      updateMessage(await res.json() as ConnectMessage);
    } else {
      updateMessage(prev); // revert on error
    }
  }

  // ─── Edit / Delete handlers ─────────────────────────────────────────────────

  const handleEdit = useCallback((msg: ConnectMessage) => {
    setEditingMessage(msg);
  }, []);

  // Opens the delete dialog; actual API call happens in the ConfirmDialog onConfirm
  const handleDelete = useCallback((messageId: string) => {
    setConfirmDeleteId(messageId);
  }, []);

  const doDelete = useCallback(async (messageId: string) => {
    const res = await fetch(`/api/connect/rooms/${room.id}/messages/${messageId}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    const updated = await res.json();
    updateMessage(updated as ConnectMessage);
  }, [room.id, updateMessage]);

  const handleEdited = useCallback((msg: unknown) => {
    updateMessage(msg as ConnectMessage);
  }, [updateMessage]);

  // ─── Search ─────────────────────────────────────────────────────────────────

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/connect/rooms/${room.id}/messages?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.messages);
    } catch {
      // best-effort
    } finally {
      setSearching(false);
    }
  }, [room.id]);

  // ─── Archive ────────────────────────────────────────────────────────────────

  const handleArchive = useCallback(() => {
    setShowArchiveConfirm(true);
  }, []);

  // Delete chat for me — leaves the DM (sets leftAt) so it disappears from own list only
  const doDeleteChat = useCallback(async () => {
    setShowDeleteChatConfirm(false);
    await fetch(`/api/connect/rooms/${room.id}/members/${currentUserId}`, { method: "DELETE" }).catch(() => {});
    onRefresh?.();
    onBack?.();
  }, [room.id, currentUserId, onRefresh, onBack]);

  const doArchive = useCallback(async () => {
    setShowArchiveConfirm(false);
    await fetch(`/api/connect/rooms/${room.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !room.archivedAt }),
    });
    await onRefresh?.();
  }, [room.id, room.archivedAt, onRefresh]);

  // ─── Meeting actions ────────────────────────────────────────────────────────

  const startMeeting = useCallback(
    async (type: "AUDIO" | "VIDEO") => {
      setStartingMeeting(type);
      setMeetingError(null);
      try {
        const res = await fetch(`/api/connect/rooms/${room.id}/meetings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
        const data = await res.json();

        if (res.status === 409 && data.meetingId) {
          // Active meeting already exists — join it instead
          const joinRes = await fetch(`/api/connect/meetings/${data.meetingId}/join`, {
            method: "POST",
          });
          if (joinRes.ok) {
            const joinData = await joinRes.json();
            setOpenMeeting({
              id: data.meetingId,
              jitsiRoomId: joinData.jitsiRoomId,
              audioOnly: type === "AUDIO",
              isCreator: false,
            });
          }
          return;
        }

        if (!res.ok) {
          setMeetingError(data.error ?? "Failed to start meeting");
          return;
        }

        setOpenMeeting({
          id: data.id,
          jitsiRoomId: data.jitsiRoomId,
          audioOnly: type === "AUDIO",
          isCreator: true,
        });
      } catch {
        setMeetingError("Failed to start meeting. Please try again.");
      } finally {
        setStartingMeeting(null);
      }
    },
    [room.id],
  );

  const handleJoinFromBanner = useCallback(
    (meeting: ActiveMeeting, audioOnly: boolean) => {
      setOpenMeeting({
        id: meeting.id,
        jitsiRoomId: meeting.jitsiRoomId,
        audioOnly,
        isCreator: meeting.createdById === currentUserId,
      });
    },
    [currentUserId],
  );

  const handleLeave = useCallback(async () => {
    if (!openMeeting) return;
    await fetch(`/api/connect/meetings/${openMeeting.id}/leave`, { method: "POST" }).catch(() => {});
    setOpenMeeting(null);
  }, [openMeeting]);

  const handleEndForAll = useCallback(async () => {
    if (!openMeeting) return;
    await fetch(`/api/connect/meetings/${openMeeting.id}/end`, { method: "POST" }).catch(() => {});
    setOpenMeeting(null);
  }, [openMeeting]);

  // ────────────────────────────────────────────────────────────────────────────

  const title = roomTitle(room, currentUserId);
  const subtitle = roomSubtitle(room, currentUserId);

  // DM partner presence (only for DIRECT rooms)
  const dmPartnerId =
    room.type === "DIRECT"
      ? room.members.find((m) => m.userId !== currentUserId)?.userId
      : undefined;
  const dmPresence: PresenceStatus | undefined = dmPartnerId
    ? (presenceMap?.[dmPartnerId] ?? "OFFLINE")
    : undefined;

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
          {onBack && (
            <button
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground transition-colors lg:hidden"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          {room.type === "GROUP" && room.avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={room.avatarUrl}
              alt=""
              className="w-7 h-7 rounded-full object-cover shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {room.type === "GROUP" && !room.avatarUrl && (
                <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
              <h2 className="font-semibold text-sm truncate">{title}</h2>
            </div>
            {room.type === "GROUP" && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
            {dmPresence && (
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    PRESENCE_COLORS[dmPresence],
                  )}
                />
                <span className="text-[10px] text-muted-foreground">
                  {PRESENCE_LABELS[dmPresence]}
                </span>
              </div>
            )}
          </div>

          {/* Meeting start buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => startMeeting("AUDIO")}
              disabled={!!startingMeeting || !!openMeeting}
              title="Start audio meeting"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {startingMeeting === "AUDIO" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Phone className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => startMeeting("VIDEO")}
              disabled={!!startingMeeting || !!openMeeting}
              title="Start video meeting"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {startingMeeting === "VIDEO" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Video className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => { setSearchQuery(""); setSearchResults(null); setShowSearch((v) => !v); }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Search messages"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={handleArchive}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={room.archivedAt ? "Unarchive" : "Archive conversation"}
            >
              <Archive className="w-4 h-4" />
            </button>
            {room.type === "DIRECT" && (
              <button
                onClick={() => setShowDeleteChatConfirm(true)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="Delete chat for me"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {room.type === "GROUP" && (
            <button
              onClick={() => setShowGroupInfo(true)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title="Group info"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="px-4 py-2 border-b border-border bg-muted/30 shrink-0 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="Search messages…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {searching && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground shrink-0" />}
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setSearchResults(null); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Active meeting banner — polls independently */}
        <ActiveMeetingBanner
          roomId={room.id}
          currentUserId={currentUserId}
          onJoin={handleJoinFromBanner}
          inMeeting={!!openMeeting}
        />

        {/* Meeting error */}
        {meetingError && (
          <div className="px-4 py-2 text-xs text-red-500 bg-red-500/10 border-b border-red-500/20 shrink-0 flex items-center justify-between">
            <span>{meetingError}</span>
            <button
              onClick={() => setMeetingError(null)}
              className="ml-2 text-red-400 hover:text-red-500"
            >
              ✕
            </button>
          </div>
        )}

        {/* Message list */}
        <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {searchResults !== null ? (
            <>
              <div className="text-xs text-muted-foreground py-2">
                {searching
                  ? "Searching…"
                  : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""} for "${searchQuery}"`}
              </div>
              {searchResults.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.senderId === currentUserId}
                  selfSlug={selfSlug}
                />
              ))}
            </>
          ) : (
            <>
              {hasMore && (
                <button
                  onClick={loadMore}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Load earlier messages
                </button>
              )}

              {loading && messages.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Loading messages…
                </div>
              )}

              {!loading && messages.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No messages yet. Say hello!
                </div>
              )}

              {messages.map((msg, i) => {
                const prev = messages[i - 1];
                const showDateDivider = !prev || !sameDay(prev.createdAt, msg.createdAt);
                return (
                  <div key={msg.id}>
                    {showDateDivider && <DateDivider iso={msg.createdAt} />}
                    <MessageBubble
                      message={msg}
                      isOwn={msg.senderId === currentUserId}
                      selfSlug={selfSlug}
                      readUpTo={readUpTo}
                      currentUserId={currentUserId}
                      onReact={handleReact}
                      onEdit={msg.senderId === currentUserId ? handleEdit : undefined}
                      onDelete={handleDelete}
                    />
                  </div>
                );
              })}

              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Typing indicator */}
        {typing.length > 0 && !searchResults && (
          <div className="px-4 py-1 text-xs text-muted-foreground italic shrink-0">
            {typing.map((t) => t.name ?? "Someone").join(", ")}
            {typing.length === 1 ? " is typing…" : " are typing…"}
          </div>
        )}

        {/* Input */}
        <MessageInput
          roomId={room.id}
          onSending={handleSending}
          onSent={handleSent}
          onSendFailed={handleSendFailed}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
          onEdited={handleEdited}
        />
      </div>

      {/* Group info panel */}
      {showGroupInfo && (
        <GroupInfoPanel
          room={room}
          currentUserId={currentUserId}
          staffUsers={staffUsers}
          onClose={() => setShowGroupInfo(false)}
          onRefresh={async () => { await onRefresh?.(); }}
        />
      )}

      {/* Meeting overlay — covers full viewport */}
      {openMeeting && (
        <MeetingModal
          meetingId={openMeeting.id}
          jitsiRoomId={openMeeting.jitsiRoomId}
          displayName={currentUserName ?? "User"}
          audioOnly={openMeeting.audioOnly}
          isCreator={openMeeting.isCreator}
          onLeave={handleLeave}
          onEndForAll={handleEndForAll}
        />
      )}

      {/* Delete message confirmation */}
      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete message?"
        description="This message will be removed for everyone in the conversation."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (confirmDeleteId) doDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Archive / unarchive confirmation */}
      <ConfirmDialog
        open={showArchiveConfirm}
        title={room.archivedAt ? "Unarchive conversation?" : "Archive conversation?"}
        description={
          room.archivedAt
            ? "This conversation will be moved back to your active chats."
            : "This conversation will be hidden from your active chats. You can always unarchive it later."
        }
        confirmLabel={room.archivedAt ? "Unarchive" : "Archive"}
        onConfirm={doArchive}
        onCancel={() => setShowArchiveConfirm(false)}
      />

      {/* Delete DM chat for me */}
      <ConfirmDialog
        open={showDeleteChatConfirm}
        title="Delete chat for you?"
        description="This conversation will be removed from your list. The other person will still see it. If they message you again, it will reappear."
        confirmLabel="Delete"
        destructive
        onConfirm={doDeleteChat}
        onCancel={() => setShowDeleteChatConfirm(false)}
      />
    </>
  );
}
