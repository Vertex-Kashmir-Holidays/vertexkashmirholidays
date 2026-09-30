"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const LIKED_KEY = "vkh_liked_hotels";

// First line of defense against an accidental double-click — the same
// localStorage-based per-browser pattern the cookie-consent banner already
// uses. The server-side per-IP rate limit (POST /api/hotel-suppliers/[id]/
// like) is the real backstop against clearing storage or an incognito retry.
function readLiked(): string[] {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeLiked(ids: string[]): void {
  try {
    localStorage.setItem(LIKED_KEY, JSON.stringify(ids));
  } catch {
    // best-effort — a failed write just means this browser might allow a
    // second like later; the server-side rate limit still bounds abuse.
  }
}

interface HotelLikeButtonProps {
  hotelId: string;
  className?: string;
}

// Internal, aggregate visitor-interest signal — NOT a customer preference,
// NOT attached to a Lead. See HotelSupplier.publicLikeCount's doc comment.
// Deliberately does not display the running count back to the visitor (the
// purpose is explicitly internal) — only a liked/not-liked state.
export function HotelLikeButton({ hotelId, className }: HotelLikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLiked(readLiked().includes(hotelId));
  }, [hotelId]);

  async function handleLike() {
    if (liked || busy) return;
    setBusy(true);
    setLiked(true); // optimistic — a failed request just means the count didn't tick, no visible error needed for a low-stakes interaction
    writeLiked([...readLiked(), hotelId]);
    try {
      await fetch(`/api/hotel-suppliers/${hotelId}/like`, { method: "POST" });
    } catch {
      // best-effort — see above.
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={liked || busy}
      aria-pressed={liked}
      aria-label={liked ? "You liked this property" : "Like this property"}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold transition",
        liked
          ? "border-red-400/40 bg-red-500/10 text-red-500"
          : "border-border text-muted-foreground hover:border-red-400/40 hover:text-red-500",
        className,
      )}
    >
      <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} strokeWidth={2} />
      {liked ? "Liked" : "Like this property"}
    </button>
  );
}
