"use client";

import { useEffect } from "react";
import { captureAttributionClient } from "@/lib/attribution";

/** Fires once per browser on first load — see captureAttributionClient(). */
export function AttributionCapture() {
  useEffect(() => {
    captureAttributionClient();
  }, []);

  return null;
}
