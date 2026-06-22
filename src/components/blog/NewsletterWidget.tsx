"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NewsletterWidget() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Failed to subscribe");
      }
      setDone(true);
      toast.success("You're subscribed! 🎉");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-brand-navy rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-4 h-4 text-brand-green" />
        <span className="text-xs font-bold text-brand-green uppercase tracking-wider">Newsletter</span>
      </div>
      <h3 className="font-display font-bold text-white text-base mb-1">
        Subscribe to Newsletter
      </h3>
      <p className="text-white/55 text-xs mb-4 leading-relaxed">
        Get the latest travel tips, exclusive deals, and Kashmir updates.
      </p>

      {done ? (
        <p className="flex items-center gap-1.5 text-brand-green text-sm font-semibold py-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2.2} /> Subscribed! Welcome to the Kashmir community.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full px-3 py-2 text-sm bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition"
          />
          <Button
            type="submit"
            disabled={loading}
            size="sm"
            className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-bold"
          >
            {loading && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
            Subscribe
          </Button>
        </form>
      )}
      <p className="text-white/30 text-[10px] mt-2">No spam. Unsubscribe anytime.</p>
    </div>
  );
}
