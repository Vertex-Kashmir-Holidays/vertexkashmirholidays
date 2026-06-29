"use client";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { useRoomList } from "./hooks/useRoomList";
import { usePresence } from "./hooks/usePresence";
import { useNotificationSound } from "./hooks/useNotificationSound";
import { RoomList } from "./RoomList";
import { ChatView } from "./ChatView";
import { cn } from "@/lib/utils";
import type { PresenceMap } from "./hooks/usePresence";

interface StaffUser {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
}

interface Props {
  currentUserId: string;
  staffUsers: StaffUser[];
  initialRoomId?: string;
}

export function ConnectClient({ currentUserId, staffUsers, initialRoomId }: Props) {
  const { rooms, loading, refetch } = useRoomList();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialRoomId ?? null);
  const [showList, setShowList] = useState(!initialRoomId);
  const { playMessage, unlock } = useNotificationSound();

  // Track unread counts across polls to detect new background-room messages
  const prevUnreadRef = useRef<Map<string, number>>(new Map());
  const firstRunRef = useRef(true);
  const selectedRoomIdRef = useRef(selectedRoomId);
  useEffect(() => { selectedRoomIdRef.current = selectedRoomId; }, [selectedRoomId]);

  useEffect(() => {
    if (rooms.length === 0) return;
    if (firstRunRef.current) {
      firstRunRef.current = false;
      prevUnreadRef.current = new Map(rooms.map((r) => [r.id, r.unreadCount]));
      return;
    }
    const prev = prevUnreadRef.current;
    for (const room of rooms) {
      if (room.id === selectedRoomIdRef.current) continue; // user is actively reading this
      if ((prev.get(room.id) ?? 0) < room.unreadCount) {
        playMessage();
        break; // one sound per poll tick
      }
    }
    prevUnreadRef.current = new Map(rooms.map((r) => [r.id, r.unreadCount]));
  }, [rooms, playMessage]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;

  // Collect unique user IDs from DM rooms to poll their presence
  const dmPartnerIds = useMemo<string[]>(() => {
    const ids = new Set<string>();
    for (const r of rooms) {
      if (r.type !== "DIRECT") continue;
      for (const m of r.members) {
        if (m.userId !== currentUserId) ids.add(m.userId);
      }
    }
    return [...ids];
  }, [rooms, currentUserId]);

  const presenceMap: PresenceMap = usePresence(dmPartnerIds);

  const handleSelectRoom = useCallback((roomId: string) => {
    unlock(); // user clicked → pre-authorize AudioContext for timer-triggered sounds
    setSelectedRoomId(roomId);
    setShowList(false);
  }, [unlock]);

  const handleStartDM = useCallback(
    async (userId: string) => {
      try {
        const res = await fetch(`/api/connect/direct/${userId}`, { method: "POST" });
        if (!res.ok) return;
        const room = await res.json();
        await refetch();
        setSelectedRoomId(room.id);
        setShowList(false);
      } catch {
        // best-effort
      }
    },
    [refetch],
  );

  const handleGroupCreated = useCallback(
    async (roomId: string) => {
      await refetch();
      setSelectedRoomId(roomId);
      setShowList(false);
    },
    [refetch],
  );

  return (
    <div
      className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-xl border border-border bg-card"
      onClick={unlock}
    >
      {/* Sidebar */}
      <div
        className={cn(
          "w-72 shrink-0 border-r border-border flex flex-col",
          !showList && "hidden lg:flex",
          showList && "flex",
        )}
      >
        <RoomList
          rooms={rooms}
          loading={loading}
          selectedRoomId={selectedRoomId}
          currentUserId={currentUserId}
          staffUsers={staffUsers}
          presenceMap={presenceMap}
          onSelect={handleSelectRoom}
          onStartDM={handleStartDM}
          onGroupCreated={handleGroupCreated}
        />
      </div>

      {/* Chat area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          showList && "hidden lg:flex",
          !showList && "flex",
        )}
      >
        {selectedRoom ? (
          <ChatView
            key={selectedRoom.id}
            room={selectedRoom}
            currentUserId={currentUserId}
            staffUsers={staffUsers}
            presenceMap={presenceMap}
            onRefresh={refetch}
            onBack={() => setShowList(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p className="text-sm">Select a conversation or start a new DM</p>
          </div>
        )}
      </div>
    </div>
  );
}
