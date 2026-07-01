"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Phone, PhoneOff, Video, PhoneIncoming } from "lucide-react";
import { useNotificationSound } from "./hooks/useNotificationSound";
import { MeetingModal } from "./MeetingModal";

interface IncomingMeeting {
  id: string;
  title: string;
  type: "AUDIO" | "VIDEO";
  jitsiRoomId: string;
  createdById: string;
  roomId: string | null;
  room: { type: "DIRECT" | "GROUP" } | null;
  participants: Array<{ userId: string; user: { id: string; name: string | null; image: string | null } }>;
}

interface OpenMeeting {
  id: string;
  jitsiRoomId: string;
  audioOnly: boolean;
  isCreator: boolean;
}

interface Props {
  currentUserId: string;
  currentUserName: string;
}

export function GlobalCallNotification({ currentUserId, currentUserName }: Props) {
  const searchParams = useSearchParams();
  const currentRoomRef = useRef<string | null>(null);

  useEffect(() => {
    currentRoomRef.current = searchParams.get("room");
  });

  const [incoming, setIncoming] = useState<IncomingMeeting | null>(null);
  const [ringing, setRinging] = useState(false);
  const [joining, setJoining] = useState(false);
  const [ending, setEnding] = useState(false);
  const [openMeeting, setOpenMeeting] = useState<OpenMeeting | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const prevIdRef = useRef<string | null>(null);
  const openMeetingRef = useRef<OpenMeeting | null>(null);
  openMeetingRef.current = openMeeting;

  const { playRing, stopRing } = useNotificationSound();

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/connect/meetings/incoming");
      if (!res.ok) {
        setIncoming(null);
        prevIdRef.current = null;
        stopRing();
        setRinging(false);
        return;
      }
      const data: IncomingMeeting | null = await res.json();

      if (!data) {
        setIncoming(null);
        prevIdRef.current = null;
        stopRing();
        setRinging(false);
        return;
      }

      setIncoming(data);

      // Ring for every incoming call — including the currently open room.
      // ActiveMeetingBanner shows the inline join UI for the current room but
      // no longer plays sound; we own all ringing here.
      if (data.id !== prevIdRef.current) {
        setDismissedId(null);
        prevIdRef.current = data.id;
        if (!openMeetingRef.current) {
          playRing();
          setRinging(true);
        }
      }
    } catch {
      // best-effort
    }
  }, [playRing, stopRing]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 3_000);
    return () => {
      clearInterval(id);
      stopRing();
    };
  }, [poll, stopRing]);

  // ── handlers ────────────────────────────────────────────────────────────────

  async function handleJoin(audioOnly: boolean) {
    if (!incoming || joining) return;
    setJoining(true);
    stopRing();
    setRinging(false);
    try {
      const res = await fetch(`/api/connect/meetings/${incoming.id}/join`, { method: "POST" });
      if (res.ok) {
        setOpenMeeting({
          id: incoming.id,
          jitsiRoomId: incoming.jitsiRoomId,
          audioOnly,
          isCreator: incoming.createdById === currentUserId,
        });
        setIncoming(null);
      }
    } catch {
      // best-effort
    } finally {
      setJoining(false);
    }
  }

  async function handleDecline() {
    if (!incoming || ending) return;
    setEnding(true);
    stopRing();
    setRinging(false);
    try {
      await fetch(`/api/connect/meetings/${incoming.id}/end`, { method: "POST" });
    } catch {
      // best-effort
    } finally {
      setEnding(false);
    }
  }

  function handleDismiss() {
    if (!incoming) return;
    stopRing();
    setRinging(false);
    setDismissedId(incoming.id);
  }

  async function handleLeave() {
    if (!openMeeting) return;
    const mid = openMeeting.id;
    setOpenMeeting(null);
    await fetch(`/api/connect/meetings/${mid}/leave`, { method: "POST" }).catch(() => {});
  }

  async function handleEndForAll() {
    if (!openMeeting) return;
    const mid = openMeeting.id;
    setOpenMeeting(null);
    await fetch(`/api/connect/meetings/${mid}/end`, { method: "POST" }).catch(() => {});
  }

  // ── render ──────────────────────────────────────────────────────────────────

  const currentRoom = searchParams.get("room");
  const isCurrentRoom = !!incoming?.roomId && incoming.roomId === currentRoom;
  // Don't show the floating card when the user is in that room — ActiveMeetingBanner
  // provides the inline join UI there. We still ring (handled in poll above).
  const showCard = incoming && !openMeeting && dismissedId !== incoming.id && !isCurrentRoom;
  const roomType = incoming?.room?.type ?? "GROUP";
  const isCreator = incoming?.createdById === currentUserId;
  const callerName =
    incoming?.participants.find((p) => p.userId === incoming.createdById)?.user.name ??
    "Someone";

  return (
    <>
      {showCard && (
        <div
          className={`fixed bottom-6 right-6 z-40 w-76 rounded-2xl border shadow-2xl bg-card overflow-hidden transition-all ${
            ringing ? "animate-pulse" : ""
          }`}
        >
          {/* Coloured top bar */}
          <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-500" />

          <div className="p-4">
            {/* Icon + title row */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center shrink-0 ${
                  ringing ? "animate-bounce" : ""
                }`}
              >
                <PhoneIncoming className="w-5 h-5 text-green-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {ringing ? "Incoming call…" : incoming!.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {callerName} · {roomType === "DIRECT" ? "1-on-1" : "Group call"}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleJoin(true)}
                disabled={joining || ending}
                className="flex items-center gap-1.5 flex-1 justify-center text-xs px-3 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
              >
                <Phone className="w-3.5 h-3.5" />
                Audio
              </button>
              <button
                onClick={() => handleJoin(false)}
                disabled={joining || ending}
                className="flex items-center gap-1.5 flex-1 justify-center text-xs px-3 py-2 rounded-xl bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/25 transition-colors font-medium disabled:opacity-50"
              >
                <Video className="w-3.5 h-3.5" />
                Video
              </button>
              {roomType === "DIRECT" && !isCreator ? (
                <button
                  onClick={handleDecline}
                  disabled={joining || ending}
                  className="flex items-center gap-1.5 flex-1 justify-center text-xs px-3 py-2 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 transition-colors font-medium disabled:opacity-50"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  Decline
                </button>
              ) : (
                <button
                  onClick={handleDismiss}
                  disabled={joining || ending}
                  className="flex items-center gap-1.5 flex-1 justify-center text-xs px-3 py-2 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 transition-colors font-medium disabled:opacity-50"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {openMeeting && (
        <MeetingModal
          meetingId={openMeeting.id}
          jitsiRoomId={openMeeting.jitsiRoomId}
          displayName={currentUserName}
          audioOnly={openMeeting.audioOnly}
          isCreator={openMeeting.isCreator}
          onLeave={handleLeave}
          onEndForAll={handleEndForAll}
          onAnswered={() => {}}
        />
      )}
    </>
  );
}
