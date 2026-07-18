// src/components/campaign/CampaignWhatsAppFloat.tsx
"use client";

import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons/brand";

interface CampaignWhatsAppFloatProps {
  href: string;
}

export function CampaignWhatsAppFloat({ href }: CampaignWhatsAppFloatProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-5 z-50 grid h-[52px] w-[52px] place-items-center rounded-full bg-[#25D366] text-white shadow-card transition hover:scale-110 lg:bottom-6"
      aria-label="Chat on WhatsApp"
    >
      <WhatsAppIcon className="h-6 w-6" />
    </Link>
  );
}
