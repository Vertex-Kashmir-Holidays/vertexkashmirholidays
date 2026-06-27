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
    trackBookingCompleted(bookingId, value, packageName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
