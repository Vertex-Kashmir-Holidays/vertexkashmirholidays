"use client";
import { useState, useEffect, useCallback } from "react";
import { Phone, Video } from "lucide-react";

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
  currentUserId: string;
  /** Called when the user clicks a Join button — parent opens MeetingModal. */
  onJoin: (meeting: ActiveMeeting, audioOnly: boolean) => void;
  /** Set to true while the user is already inside a meeting for this room. */
  inMeeting: boolean;
}

export function ActiveMeetingBanner({ roomId, currentUserId, onJoin, inMeeting }: Props) {
  const [meeting, setMeeting] = useState<ActiveMeeting | null>(null);
  const [joining, setJoining] = useState(false);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/connect/rooms/${roomId}/meetings/active`);
      if (res.ok) setMeeting(await res.json());
    } catch {
      // best-effort
    }
  }, [roomId]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, [poll]);

  // Hide if there's no active meeting or user is already inside
  if (!meeting || inMeeting) return null;

  const alreadyIn = meeting.participants.some((p) => p.userId === currentUserId);
  const count = meeting.participants.length;

  async function handleJoin(audioOnly: boolean) {
    if (!meeting || joining) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/connect/meetings/${meeting.id}/join`, { method: "POST" });
      if (res.ok) onJoin(meeting, audioOnly);
    } catch {
      // best-effort
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-green-500/10 border-b border-green-500/20 shrink-0">
      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-green-700 dark:text-green-400 truncate">
          {meeting.title}
        </p>
        <p className="text-[10px] text-green-600/70 dark:text-green-500/70">
          {count} participant{count !== 1 ? "s" : ""}
          {alreadyIn ? " · you are in this meeting" : ""}
        </p>
      </div>
      {!alreadyIn && (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => handleJoin(true)}
            disabled={joining}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30 transition-colors font-medium disabled:opacity-50"
            title="Join audio"
          >
            <Phone className="w-3 h-3" />
            Audio
          </button>
          <button
            onClick={() => handleJoin(false)}
            disabled={joining}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30 transition-colors font-medium disabled:opacity-50"
            title="Join video"
          >
            <Video className="w-3 h-3" />
            Video
          </button>
        </div>
      )}
    </div>
  );
}
