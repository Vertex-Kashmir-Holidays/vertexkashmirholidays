// src/components/sections/DestinationDetailSidebar.tsx
'use client';

import { motion } from 'framer-motion';

interface DestinationDetailSidebarProps {
  name: string;
  quickInfo: {
    label: string;
    value: string;
    icon: string;
  }[];
  weather: {
    temperature: number;
    condition: string;
    humidity: number;
    wind: number;
    feelsLike: number;
  };
}

export function DestinationDetailSidebar({ name, quickInfo, weather }: DestinationDetailSidebarProps) {
  return (
    <aside className="space-y-6 lg:sticky lg:top-6">
      {/* Quick Info */}
      <motion.div
        className="rounded-2xl border border-border bg-card p-5 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-[17px] font-bold">Quick Info</h2>
        <ul className="mt-4 space-y-4">
          {quickInfo.map((info, i) => (
            <motion.li
              key={i}
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={info.icon} />
                </svg>
              </span>
              <div className="leading-snug">
                <p className="text-[12.5px] font-bold">{info.label}</p>
                <p className="mt-0.5 text-[11.5px] text-muted-foreground">{info.value}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Weather */}
      <motion.div
        className="rounded-2xl border border-border bg-card p-5 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-bold">Today's Weather</p>
          <p className="text-[12px] font-semibold text-muted-foreground">{name}</p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="flex items-start text-[40px] font-extrabold leading-none">
              <svg viewBox="0 0 24 24" className="mr-1 mt-1 h-5 w-5 text-link" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 4v10.5a4 4 0 1 1-4-4" />
                <path d="M14 4a2 2 0 1 1 4 0v6" />
              </svg>
              {weather.temperature}°C
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-link" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.5 19a4.5 4.5 0 1 0 0-9h-1.3A7 7 0 1 0 4 16.4" />
              </svg>
              {weather.condition}
            </p>
          </div>
          <div className="relative h-16 w-20">
            <svg viewBox="0 0 24 24" className="absolute right-1 top-0 h-10 w-10 text-amber-400" fill="currentColor">
              <circle cx="12" cy="12" r="5" />
              <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </g>
            </svg>
            <svg viewBox="0 0 24 24" className="absolute bottom-0 left-0 h-11 w-14 text-sky-200" fill="currentColor">
              <path d="M17.5 19a4.5 4.5 0 1 0-.9-8.9A7 7 0 1 0 5 17.5c.5.9 1.5 1.5 2.6 1.5Z" />
            </svg>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-border border-t border-border pt-4 text-center">
          <div>
            <p className="text-[11px] text-muted-foreground">Humidity</p>
            <p className="mt-1 text-[13.5px] font-bold">{weather.humidity}%</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Wind</p>
            <p className="mt-1 text-[13.5px] font-bold">{weather.wind} km/h</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Feels Like</p>
            <p className="mt-1 text-[13.5px] font-bold">{weather.feelsLike}°C</p>
          </div>
        </div>
      </motion.div>
    </aside>
  );
}