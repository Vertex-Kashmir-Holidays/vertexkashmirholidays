"use client";
import { useEffect, useRef } from "react";
import { PhoneOff } from "lucide-react";

// Minimal typings for the Jitsi External API (loaded dynamically from meet.jit.si)
interface JitsiOptions {
  roomName: string;
  parentNode: HTMLElement;
  width?: string | number;
  height?: string | number;
  configOverwrite?: Record<string, unknown>;
  interfaceConfigOverwrite?: Record<string, unknown>;
  userInfo?: { displayName?: string };
}

interface JitsiAPI {
  addEventListener(event: string, handler: () => void): void;
  dispose(): void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: JitsiOptions) => JitsiAPI;
  }
}

interface Props {
  meetingId: string;
  jitsiRoomId: string;
  displayName: string;
  audioOnly: boolean;
  isCreator: boolean;
  onLeave: () => void;
  onEndForAll: () => void;
}

export function MeetingModal({
  jitsiRoomId,
  displayName,
  audioOnly,
  isCreator,
  onLeave,
  onEndForAll,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiAPI | null>(null);

  useEffect(() => {
    function init() {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

      const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName: jitsiRoomId,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        configOverwrite: {
          startWithVideoMuted: audioOnly,
          startWithAudioMuted: false,
          disableDeepLinking: true,
          prejoinPageEnabled: false,
          // Screen sharing is on by default in Jitsi
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          DEFAULT_LOGO_URL: "",
          SHOW_CHROME_EXTENSION_BANNER: false,
          TOOLBAR_ALWAYS_VISIBLE: true,
        },
        userInfo: { displayName },
      });

      apiRef.current = api;
      // Jitsi fires readyToClose when user clicks the built-in hang-up button
      api.addEventListener("readyToClose", onLeave);
    }

    if (window.JitsiMeetExternalAPI) {
      init();
    } else {
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
    }

    return () => {
      apiRef.current?.dispose();
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jitsiRoomId]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1e1e1e]">
      {/* Minimal action strip — doesn't interfere with Jitsi's own toolbar */}
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

      {/* Jitsi mounts its iframe here — flex-1 gives it all remaining height */}
      <div ref={containerRef} className="flex-1 min-h-0 w-full" />
    </div>
  );
}
