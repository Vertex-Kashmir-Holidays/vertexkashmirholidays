"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  value: string | null | undefined;
  label?: string;
  className?: string;
}

/** One-click copy-to-clipboard, with a toast confirmation — used throughout the Offline Conversions detail page. */
export function CopyButton({ value, label = "Copied", className }: Props) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value!);
      setCopied(true);
      toast.success(`${label} copied to clipboard.`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy — your browser blocked clipboard access.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center justify-center w-5 h-5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0",
        className,
      )}
      title={`Copy ${label}`}
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}
