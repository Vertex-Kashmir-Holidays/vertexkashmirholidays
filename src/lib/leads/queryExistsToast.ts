"use client";

import { toast } from "sonner";
import { requestWhatsAppOpen } from "@/lib/leads/whatsappGate";

/** The 409 POST /api/leads returns when the visitor already has a query in
 *  progress — shown with WhatsApp and Call so they can check its status. */
export function showQueryExistsToast(res: { error?: string; whatsapp?: string; call?: string | null }) {
  const wa = res.whatsapp;
  const call = res.call;
  toast.error(res.error || "We already have your query. Call or WhatsApp us to check its status.", {
    duration: 12000,
    ...(wa ? { action: { label: "WhatsApp", onClick: () => requestWhatsAppOpen(wa) } } : {}),
    ...(call ? { cancel: { label: "Call", onClick: () => (window.location.href = call) } } : {}),
  });
}
