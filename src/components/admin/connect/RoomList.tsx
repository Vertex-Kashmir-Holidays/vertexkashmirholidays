"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Users, MessageSquare, Plus } from "lucide-react";
import type { ConnectRoom } from "./hooks/useRoomList";
import type { PresenceMap, PresenceStatus } from "./hooks/usePresence";
import { NewGroupDialog } from "./NewGroupDialog";

interface StaffUser {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
}

interface Props {
  rooms: ConnectRoom[];
  loading: boolean;
  selectedRoomId: string | null;
  currentUserId: string;
  staffUsers: StaffUser[];
  presenceMap: PresenceMap;
  onSelect: (roomId: string) => void;
  onStartDM: (userId: string) => void;
  onGroupCreated: (roomId: string) => void;
}

const PRESENCE_DOT: Record<PresenceStatus, string> = {
  ONLINE:  "bg-green-500",
  AWAY:    "bg-amber-400",
  BUSY:    "bg-red-500",
  OFFLINE: "bg-zinc-400",
};

function PresenceDot({ status }: { status: PresenceStatus }) {
  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card shrink-0",
        PRESENCE_DOT[status],
      )}
    />
  );
}

function UserAvatar({
  name,
  image,
  avatarUrl,
  size = 36,
  presenceStatus,
}: {
  name: string | null;
  image: string | null;
  avatarUrl?: string | null;
  size?: number;
  presenceStatus?: PresenceStatus;
}) {
  const src = avatarUrl ?? image;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="rounded-full object-cover w-full h-full"
        />
      ) : (
        <div
          className="rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-xs w-full h-full"
        >
          {(name ?? "?").charAt(0).toUpperCase()}
        </div>
      )}
      {presenceStatus && presenceStatus !== "OFFLINE" && (
        <PresenceDot status={presenceStatus} />
      )}
    </div>
  );
}

function roomDisplayName(room: ConnectRoom, currentUserId: string): string {
  if (room.type === "GROUP") return room.name ?? "Group";
  const other = room.members.find((m) => m.userId !== currentUserId);
  return other?.user.name ?? "Direct message";
}

function roomAvatarProps(room: ConnectRoom, currentUserId: string) {
  if (room.type === "GROUP") {
    return { name: room.name ?? "G", image: null, avatarUrl: room.avatarUrl };
  }
  const other = room.members.find((m) => m.userId !== currentUserId);
  return { name: other?.user.name ?? null, image: other?.user.image ?? null, avatarUrl: null };
}

function lastMessagePreview(room: ConnectRoom): string {
  const msg = room.messages[0];
  if (!msg) return "No messages yet";
  if (msg.body) return msg.body.length > 45 ? msg.body.slice(0, 42) + "…" : msg.body;
  if (msg.attachmentName) return `📎 ${msg.attachmentName}`;
  return "Sent an attachment";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function RoomList({
  rooms,
  loading,
  selectedRoomId,
  currentUserId,
  staffUsers,
  presenceMap,
  onSelect,
  onStartDM,
  onGroupCreated,
}: Props) {
  const [showNewGroup, setShowNewGroup] = useState(false);

  const others = staffUsers.filter((u) => u.id !== currentUserId);
  const existingDMTargets = new Set(
    rooms
      .filter((r) => r.type === "DIRECT")
      .flatMap((r) => r.members.map((m) => m.userId))
      .filter((id) => id !== currentUserId),
  );
  const newDMCandidates = others.filter((u) => !existingDMTargets.has(u.id));

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold text-sm flex-1">Vertex Connect</span>
          <button
            onClick={() => setShowNewGroup(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="New group"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto">
          {loading && rooms.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
          )}

          {!loading && rooms.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">
              No conversations yet. Start a DM or create a group.
            </div>
          )}

          {rooms.map((room) => {
            const avProps = roomAvatarProps(room, currentUserId);
            const isActive = room.id === selectedRoomId;
            const lastMsg = room.messages[0];

            // Presence only for DM rooms
            const dmPartnerId =
              room.type === "DIRECT"
                ? room.members.find((m) => m.userId !== currentUserId)?.userId
                : undefined;
            const dmPresence: PresenceStatus | undefined = dmPartnerId
              ? (presenceMap[dmPartnerId] ?? "OFFLINE")
              : undefined;

            return (
              <button
                key={room.id}
                onClick={() => onSelect(room.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                  isActive && "bg-muted",
                )}
              >
                <div className="relative shrink-0">
                  <UserAvatar
                    {...avProps}
                    size={36}
                    presenceStatus={dmPresence}
                  />
                  {room.type === "GROUP" && !avProps.avatarUrl && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-card border border-border rounded-full p-0.5">
                      <Users className="w-2.5 h-2.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-medium truncate">
                      {roomDisplayName(room, currentUserId)}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {lastMsg && (
                        <span className="text-[10px] text-muted-foreground">
                          {timeAgo(lastMsg.createdAt)}
                        </span>
                      )}
                      {room.unreadCount > 0 && (
                        <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                          {room.unreadCount > 99 ? "99+" : room.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {lastMessagePreview(room)}
                  </p>
                </div>
              </button>
            );
          })}

          {/* New DM section */}
          {newDMCandidates.length > 0 && (
            <>
              <div className="px-4 pt-4 pb-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Start new DM
                </span>
              </div>
              {newDMCandidates.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onStartDM(u.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/60 transition-colors"
                >
                  <UserAvatar
                    name={u.name}
                    image={u.image}
                    size={32}
                    presenceStatus={presenceMap[u.id] ?? "OFFLINE"}
                  />
                  <span className="text-sm text-muted-foreground">{u.name ?? u.id}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {showNewGroup && (
        <NewGroupDialog
          staffUsers={staffUsers}
          currentUserId={currentUserId}
          onCreated={(roomId) => {
            setShowNewGroup(false);
            onGroupCreated(roomId);
          }}
          onClose={() => setShowNewGroup(false)}
        />
      )}
    </>
  );
}
