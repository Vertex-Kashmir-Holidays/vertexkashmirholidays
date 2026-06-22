// src/components/campaign/CampaignUrgencyBar.tsx
'use client';

import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CampaignUrgencyBarProps {
  offerText: string;
  deadline: string | null;
  seats: string | null;
}

export function CampaignUrgencyBar({ offerText, deadline, seats }: CampaignUrgencyBarProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!deadline) return;
    const calculateTimeLeft = () => {
      const difference = new Date(deadline).getTime() - Date.now();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  return (
    <div className="relative z-[5] border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-[1300px] flex-wrap items-center justify-center gap-x-7 gap-y-1 px-6 py-2 text-[12px] font-semibold text-white/90">
        <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {offerText}
        </motion.span>
        {deadline && (
          <span className="hidden items-center gap-2 sm:flex">
            in{' '}
            <strong className="tabular-nums text-white">
              {timeLeft.days}d : {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m :{' '}
              {String(timeLeft.seconds).padStart(2, '0')}s
            </strong>
          </span>
        )}
        {seats && <span className="flex items-center gap-1.5 text-green-glow"><Users className="h-3.5 w-3.5" strokeWidth={2.2} /> {seats}</span>}
      </div>
    </div>
  );
}
