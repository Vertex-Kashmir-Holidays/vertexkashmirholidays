// src/components/sections/CampaignStickyMobileCTA.tsx
'use client';

import Link from 'next/link';

interface CampaignStickyMobileCTAProps {
  price: string;
  cta: string;
}

export function CampaignStickyMobileCTA({ price, cta }: CampaignStickyMobileCTAProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 border-t border-white/10 bg-navy-soft/95 px-5 py-3 backdrop-blur lg:hidden">
      <div className="leading-tight">
        <p className="text-[10.5px] text-white/55">From</p>
        <p className="text-[17px] font-extrabold text-white">{price} /person</p>
      </div>
      <Link
        href="#reserve"
        className="sweep flex-1 rounded-xl bg-accent-grad py-3 text-center text-[13.5px] font-extrabold text-white ring-inner"
      >
        {cta}
      </Link>
    </div>
  );
}