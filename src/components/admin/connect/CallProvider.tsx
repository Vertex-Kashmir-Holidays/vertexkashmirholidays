"use client";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { MeetingModal } from "./MeetingModal";

interface OpenMeeting {
  id: string;
  jitsiRoomId: string;
  audioOnly: boolean;
  isCreator: boolean;
}

interface JoinableMeeting {
  id: string;
  jitsiRoomId: string;
  createdById: string;
}

interface CallContextValue {
  openMeeting: OpenMeeting | null;
  startMeeting: (roomId: string, type: "AUDIO" | "VIDEO") => Promise<{ error?: string }>;
  joinMeeting: (meeting: JoinableMeeting, audioOnly: boolean) => void;
  leaveMeeting: () => Promise<void>;
  endMeetingForAll: () => Promise<void>;
}

const CallContext = createContext<CallContextValue | null>(null);

// Owns the single active-call state for the whole admin app so the Jitsi
// session survives client-side navigation between admin pages — a call
// started or joined from Connect must not be tied to that page's component
// tree, or navigating away disposes the iframe and drops the call.
export function useCall(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
}

interface Props {
  currentUserId: string;
  currentUserName: string;
  children: ReactNode;
}

export function CallProvider({ currentUserId, currentUserName, children }: Props) {
  const [openMeeting, setOpenMeeting] = useState<OpenMeeting | null>(null);
  const noAnswerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearNoAnswerTimer = useCallback(() => {
    if (noAnswerTimerRef.current) {
      clearTimeout(noAnswerTimerRef.current);
      noAnswerTimerRef.current = null;
    }
  }, []);

  const startMeeting = useCallback(
    async (roomId: string, type: "AUDIO" | "VIDEO"): Promise<{ error?: string }> => {
      try {
        const res = await fetch(`/api/connect/rooms/${roomId}/meetings`, {
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
          return {};
        }

        if (!res.ok) return { error: data.error ?? "Failed to start meeting" };

        const newMeetingId = data.id;
        setOpenMeeting({
          id: newMeetingId,
          jitsiRoomId: data.jitsiRoomId,
          audioOnly: type === "AUDIO",
          isCreator: true,
        });
        // Auto-end after 30s if nobody joins
        clearNoAnswerTimer();
        noAnswerTimerRef.current = setTimeout(async () => {
          noAnswerTimerRef.current = null;
          await fetch(`/api/connect/meetings/${newMeetingId}/end`, { method: "POST" }).catch(
            () => {},
          );
          setOpenMeeting(null);
        }, 30_000);
        return {};
      } catch {
        return { error: "Failed to start meeting. Please try again." };
      }
    },
    [clearNoAnswerTimer],
  );

  const joinMeeting = useCallback(
    (meeting: JoinableMeeting, audioOnly: boolean) => {
      setOpenMeeting({
        id: meeting.id,
        jitsiRoomId: meeting.jitsiRoomId,
        audioOnly,
        isCreator: meeting.createdById === currentUserId,
      });
    },
    [currentUserId],
  );

  const leaveMeeting = useCallback(async () => {
    if (!openMeeting) return;
    clearNoAnswerTimer();
    const mid = openMeeting.id;
    setOpenMeeting(null);
    await fetch(`/api/connect/meetings/${mid}/leave`, { method: "POST" }).catch(() => {});
  }, [openMeeting, clearNoAnswerTimer]);

  const endMeetingForAll = useCallback(async () => {
    if (!openMeeting) return;
    clearNoAnswerTimer();
    const mid = openMeeting.id;
    setOpenMeeting(null);
    await fetch(`/api/connect/meetings/${mid}/end`, { method: "POST" }).catch(() => {});
  }, [openMeeting, clearNoAnswerTimer]);

  const handleAnswered = useCallback(() => {
    clearNoAnswerTimer();
  }, [clearNoAnswerTimer]);

  return (
    <CallContext.Provider
      value={{ openMeeting, startMeeting, joinMeeting, leaveMeeting, endMeetingForAll }}
    >
      {children}
      {openMeeting && (
        <MeetingModal
          meetingId={openMeeting.id}
          jitsiRoomId={openMeeting.jitsiRoomId}
          displayName={currentUserName}
          audioOnly={openMeeting.audioOnly}
          isCreator={openMeeting.isCreator}
          onLeave={leaveMeeting}
          onEndForAll={endMeetingForAll}
          onAnswered={handleAnswered}
        />
      )}
    </CallContext.Provider>
  );
}
