"use client";
import { useEffect, useRef, useState } from "react";
import { PhoneOff, Loader2 } from "lucide-react";

interface Props {
  meetingId: string;
  jitsiRoomId: string;
  displayName: string;
  audioOnly: boolean;
  isCreator: boolean;
  onLeave: () => void;
  onEndForAll: () => void;
  onAnswered?: () => void;
}

interface TokenData {
  jwt: string;
  appId: string;
}

interface JitsiAPI {
  addEventListeners: (listeners: Record<string, () => void>) => void;
  getIFrame: () => HTMLIFrameElement;
  dispose: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: {
      new (domain: string, options: Record<string, unknown>): JitsiAPI;
    };
  }
}

export function MeetingModal({
  meetingId,
  jitsiRoomId,
  displayName,
  audioOnly,
  isCreator,
  onLeave,
  onEndForAll,
  onAnswered,
}: Props) {
  const [token, setToken] = useState<TokenData | null>(null);
  const [tokenError, setTokenError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const answeredRef = useRef(false);
  const apiRef = useRef<JitsiAPI | null>(null);

  // Fetch JaaS JWT
  useEffect(() => {
    fetch(`/api/connect/meetings/${meetingId}/token`)
      .then((r) => r.json())
      .then((data: { jwt?: string; appId?: string }) => {
        if (data.jwt && data.appId) setToken({ jwt: data.jwt, appId: data.appId });
        else setTokenError(true);
      })
      .catch(() => setTokenError(true));
  }, [meetingId]);

  // Poll participants every 3s to auto-close when meeting ends and fire onAnswered
  useEffect(() => {
    if (!token) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/connect/meetings/${meetingId}/participants`);
        if (!res.ok) return;
        const { active, count } = (await res.json()) as { active: boolean; count: number };
        if (!active) {
          clearInterval(id);
          onLeave();
          return;
        }
        if (!answeredRef.current && count > 1) {
          answeredRef.current = true;
          onAnswered?.();
        }
      } catch {
        // best-effort
      }
    }, 3_000);
    return () => clearInterval(id);
  }, [token, meetingId, onLeave, onAnswered]);

  // Mount JitsiMeetExternalAPI — mirrors the 8x8.vc demo HTML approach
  useEffect(() => {
    if (!token || !containerRef.current) return;

    const initMeeting = () => {
      if (!window.JitsiMeetExternalAPI || !containerRef.current) return;

      const api = new window.JitsiMeetExternalAPI("8x8.vc", {
        roomName: `${token.appId}/${jitsiRoomId}`,
        parentNode: containerRef.current,
        jwt: token.jwt,
        width: "100%",
        height: "100%",
        configOverwrite: {
          startWithVideoMuted: audioOnly,
          startWithAudioMuted: false,
          disableDeepLinking: true,
          prejoinPageEnabled: false,
          disableInviteFunctions: true,
          desktopSharingEnabled: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_CHROME_EXTENSION_BANNER: false,
        },
        userInfo: { displayName, email: "" },
      });

      // Set allow attribute synchronously before the browser evaluates
      // Permissions Policy — must happen before any getUserMedia call.
      const iframe = api.getIFrame();
      iframe.setAttribute("allow", "camera; microphone; autoplay; clipboard-write");
      iframe.style.height = "100%";
      iframe.style.width = "100%";

      api.addEventListeners({
        readyToClose: onLeave,
        participantJoined: () => {
          if (!answeredRef.current) {
            answeredRef.current = true;
            onAnswered?.();
          }
        },
      });

      apiRef.current = api;
    };

    if (window.JitsiMeetExternalAPI) {
      initMeeting();
    } else {
      const script = document.createElement("script");
      script.src = `https://8x8.vc/${token.appId}/external_api.js`;
      script.async = true;
      script.onload = initMeeting;
      script.onerror = () => setTokenError(true);
      document.head.appendChild(script);
    }

    return () => {
      apiRef.current?.dispose?.();
      apiRef.current = null;
    };
  }, [token, jitsiRoomId, displayName, audioOnly, onLeave, onAnswered]);

  if (tokenError) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#1e1e1e]">
        <div className="shrink-0 flex items-center justify-end gap-2 px-4 py-2 bg-black/40 backdrop-blur-sm">
          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            Close
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-red-400 text-sm">
          Failed to connect to meeting. Please leave and try again.
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e1e1e]">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
        <span className="ml-3 text-white/50 text-sm">Connecting…</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1e1e1e]">
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-end gap-2 px-4 py-2 bg-black/40 backdrop-blur-sm">
        {isCreator && (
          <button
            onClick={onEndForAll}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-700 text-white hover:bg-red-800 transition-colors font-medium"
          >
            End for all
          </button>
        )}
        <button
          onClick={onLeave}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          Leave
        </button>
      </div>

      {/* JaaS iframe fills remaining height */}
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}
