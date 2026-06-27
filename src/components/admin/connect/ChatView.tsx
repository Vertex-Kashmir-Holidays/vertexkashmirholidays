"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, Users, Info, Phone, Video, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessages } from "./hooks/useMessages";
import type { ConnectRoom } from "./hooks/useRoomList";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { GroupInfoPanel } from "./GroupInfoPanel";
import { ActiveMeetingBanner } from "./ActiveMeetingBanner";
import { MeetingModal } from "./MeetingModal";
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
  const { messages, loading, hasMore, loadMore, appendOptimistic } = useMessages(room.id);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [openMeeting, setOpenMeeting] = useState<OpenMeeting | null>(null);
  const [startingMeeting, setStartingMeeting] = useState<"AUDIO" | "VIDEO" | null>(null);
  const [meetingError, setMeetingError] = useState<string | null>(null);

  const currentUserName =
    room.members.find((m) => m.userId === currentUserId)?.user.name ?? null;
  const selfSlug = currentUserName
    ? currentUserName.trim().split(/\s+/)[0].toLowerCase()
    : null;

  // Mark room as read on mount + whenever room changes
  useEffect(() => {
    fetch(`/api/connect/rooms/${room.id}/read`, { method: "POST" }).catch(() => {});
  }, [room.id]);

  // Scroll to bottom when new messages arrive (only if already near bottom)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const prevLen = prevLengthRef.current;
    prevLengthRef.current = messages.length;
    if (messages.length === 0) return;

    if (prevLen === 0) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    } else if (messages.length > prevLen) {
      const distFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distFromBottom < 200) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  function handleSent(msg: unknown) {
    appendOptimistic(msg as ConnectMessage);
    fetch(`/api/connect/rooms/${room.id}/read`, { method: "POST" }).catch(() => {});
  }

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
                />
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <MessageInput roomId={room.id} onSent={handleSent} />
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
    </>
  );
}
