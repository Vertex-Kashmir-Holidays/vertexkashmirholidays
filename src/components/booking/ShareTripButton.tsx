"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ShareTripButtonProps {
  tourTitle: string;
  shareUrl: string;
}

export function ShareTripButton({ tourTitle, shareUrl }: ShareTripButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = `I just booked my Kashmir trip with Vertex Kashmir Holidays — ${tourTitle}! Check it out:`;
    if (navigator.share) {
      await navigator.share({ title: tourTitle, text, url: shareUrl }).catch(() => {});
      return;
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl).catch(() => {});
    } else {
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        {copied ? (
          <Check className="w-5 h-5 text-primary" />
        ) : (
          <Share2 className="w-5 h-5 text-primary" />
        )}
      </div>
      <p className="text-xs font-bold text-foreground">Share Your Trip</p>
      <p className="text-[10px] text-muted-foreground">{copied ? "Link copied!" : "Tell your friends"}</p>
    </button>
  );
}
