"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * PATCH a hotel and refresh the server-rendered page on success. Shared by the
 * Hotel Rates table and the hotel's own page so both save the same way.
 */
export function useHotelPatch() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return function patchHotel(id: string, payload: Record<string, unknown>): Promise<boolean> {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          const res = await fetch(`/api/hotel-suppliers/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            if (res.status === 403) {
              toast.error("You don't have permission to edit hotel rates.");
            } else {
              const err = (await res.json().catch(() => null)) as { error?: string } | null;
              toast.error(typeof err?.error === "string" ? err.error : "Save failed.");
            }
            resolve(false);
            return;
          }
          toast.success("Saved.");
          router.refresh();
          resolve(true);
        } catch {
          toast.error("An error occurred.");
          resolve(false);
        }
      });
    });
  };
}
