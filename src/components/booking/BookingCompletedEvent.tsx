"use client";

import { useEffect } from "react";
import { trackBookingCompleted } from "@/lib/analytics";

interface Props {
  bookingId: string;
  value: number;
  packageName: string;
}

export function BookingCompletedEvent({ bookingId, value, packageName }: Props) {
  useEffect(() => {
    // Dedup guard: Razorpay's handler callback can fire more than once under
    // certain network conditions, causing router.push (and this component) to
    // mount multiple times for the same booking. sessionStorage persists across
    // the SPA session but resets on tab close — the right scope for a purchase.
    const key = `vk_bc_${bookingId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    trackBookingCompleted(bookingId, value, packageName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
