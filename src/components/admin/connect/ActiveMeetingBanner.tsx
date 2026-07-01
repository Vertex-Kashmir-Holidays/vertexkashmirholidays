"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useNotificationSound } from "./hooks/useNotificationSound";

export interface ActiveMeeting {
  id: string;
  title: string;
  type: "AUDIO" | "VIDEO";
  jitsiRoomId: string;
  createdById: string;
  participants: Array<{ userId: string; user: { id: string; name: string | null; image: string | null } }>;
}

interface Props {
  roomId: string;
  roomType: "DIRECT" | "GROUP";
  currentUserId: string;
  onJoin: (meeting: ActiveMeeting, audioOnly: boolean) => void;
  inMeeting: boolean;
}

export function ActiveMeetingBanner({ roomId, roomType, currentUserId, onJoin, inMeeting }: Props) {
  const [meeting, setMeeting] = useState<ActiveMeeting | null>(null);
  const [joining, setJoining] = useState(false);
  const [ending, setEnding] = useState(false);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const prevMeetingIdRef = useRef<string | null>(null);
  const { stopRing } = useNotificationSound();

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/connect/rooms/${roomId}/meetings/active`);
      if (res.ok) {
        const data: ActiveMeeting | null = await res.json();

        if (!data) {
          setMeeting(null);
          prevMeetingIdRef.current = null;
          return;
        }

        setMeeting(data);

        if (data.id !== prevMeetingIdRef.current) {
          setDismissedId(null);
          prevMeetingIdRef.current = data.id;
        }
      } else {
        setMeeting(null);
        prevMeetingIdRef.current = null;
      }
    } catch {
      // best-effort
    }
  }, [roomId]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 3_000);
    return () => clearInterval(id);
  }, [poll]);

  if (!meeting || inMeeting || dismissedId === meeting.id) return null;

  const alreadyIn = meeting.participants.some((p) => p.userId === currentUserId);
  const count = meeting.participants.length;
  const isCreator = meeting.createdById === currentUserId;

  async function handleJoin(audioOnly: boolean) {
    if (!meeting || joining) return;
    setJoining(true);
    stopRing();
    try {
      const res = await fetch(`/api/connect/meetings/${meeting.id}/join`, { method: "POST" });
      if (res.ok) onJoin(meeting, audioOnly);
    } catch {
      // best-effort
    } finally {
      setJoining(false);
    }
  }

  async function handleEndFromBanner() {
    if (!meeting || ending) return;
    setEnding(true);
    stopRing();
    try {
      await fetch(`/api/connect/meetings/${meeting.id}/end`, { method: "POST" });
    } catch {
      // best-effort
    } finally {
      setEnding(false);
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-green-500/20 bg-green-500/10 shrink-0">
      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-green-700 dark:text-green-400 truncate">
          {meeting.title}
        </p>
        <p className="text-[10px] text-green-600/70 dark:text-green-500/70">
          {count} participant{count !== 1 ? "s" : ""}
          {alreadyIn ? " · you are in this call" : ""}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {!alreadyIn && (
          <>
            <button
              onClick={() => handleJoin(true)}
              disabled={joining || ending}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30 transition-colors font-medium disabled:opacity-50"
              title="Join audio"
            >
              <Phone className="w-3 h-3" />
              Audio
            </button>
            <button
              onClick={() => handleJoin(false)}
              disabled={joining || ending}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30 transition-colors font-medium disabled:opacity-50"
              title="Join video"
            >
              <Video className="w-3 h-3" />
              Video
            </button>
            {roomType === "DIRECT" && !isCreator ? (
              <button
                onClick={handleEndFromBanner}
                disabled={joining || ending}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 transition-colors font-medium disabled:opacity-50"
                title="Decline"
              >
                <PhoneOff className="w-3 h-3" />
                Decline
              </button>
            ) : roomType === "GROUP" && !isCreator ? (
              <button
                onClick={() => { stopRing(); setDismissedId(meeting.id); }}
                disabled={joining || ending}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors font-medium disabled:opacity-50"
                title="Dismiss"
              >
                Dismiss
              </button>
            ) : null}
          </>
        )}
        {isCreator && (
          <button
            onClick={handleEndFromBanner}
            disabled={joining || ending}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 transition-colors font-medium disabled:opacity-50"
            title="End for all"
          >
            <PhoneOff className="w-3 h-3" />
            End
          </button>
        )}
      </div>
    </div>
  );
}
