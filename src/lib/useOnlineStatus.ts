"use client";

import { useEffect, useState } from "react";

// Browser-native connectivity state — no polling, no external service.
// navigator.onLine reflects the OS network interface, not true internet
// reachability, but combined with the online/offline events it's the
// standard, zero-cost way to detect a dropped connection client-side.
//
// Always starts `true` (matching what the server assumes with no `navigator`)
// and only reads the real navigator.onLine value inside useEffect — reading it
// during the initial render would mismatch the server's render whenever a user
// happens to already be offline on first load, which is exactly the scenario
// this hook exists to handle.
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}
