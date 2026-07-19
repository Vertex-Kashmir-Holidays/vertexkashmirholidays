"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { WifiOff } from "lucide-react";
import { toast } from "sonner";
import { useOnlineStatus } from "@/lib/useOnlineStatus";

const EASE = [0.22, 1, 0.36, 1] as const;

// Fixed overlay (not sticky, unlike BannerStrip) so it shows identically across
// every layout — public, admin, account, login — without coordinating with each
// one's own Navbar/header offset logic. Reappears on every real disconnect; no
// session-based dismissal, since that would hide a genuinely offline state.
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const reduceMotion = useReducedMotion();
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (isOnline) toast.success("You're back online.");
  }, [isOnline]);

  const duration = reduceMotion ? 0 : 0.28;

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          role="status"
          className="fixed inset-x-0 top-0 z-[60] overflow-hidden"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration, ease: EASE }}
        >
          <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-[13px] font-semibold text-amber-950">
            <WifiOff className="h-4 w-4 shrink-0" strokeWidth={2} />
            No internet connection. Please reconnect to continue browsing and planning your trip.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
