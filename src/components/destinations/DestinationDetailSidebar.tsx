// src/components/sections/DestinationDetailSidebar.tsx
'use client';

import { motion } from 'framer-motion';
import { Thermometer, Cloud, Sun } from 'lucide-react';

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
      {/* Weather */}
      <motion.div
        className="rounded-2xl border border-border bg-card p-5 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[16px] font-bold">Today's Weather</p>
          <p className="text-[14px] font-semibold text-muted-foreground">{name}</p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="flex items-start text-[40px] font-extrabold leading-none">
              <Thermometer className="mr-1 mt-1 h-5 w-5 text-link" strokeWidth={2} />
              {weather.temperature}°C
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[14px] font-semibold text-muted-foreground">
              <Cloud className="h-4 w-4 text-link" strokeWidth={2} />
              {weather.condition}
            </p>
          </div>
          <div className="relative h-16 w-20">
            <Sun className="absolute right-1 top-0 h-10 w-10 text-amber-400" strokeWidth={2} />
            <Cloud className="absolute bottom-0 left-0 h-11 w-14 text-sky-300" fill="currentColor" strokeWidth={1.5} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-border border-t border-border pt-4 text-center">
          <div>
            <p className="text-[12px] text-muted-foreground">Humidity</p>
            <p className="mt-1 text-[14px] font-bold">{weather.humidity}%</p>
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground">Wind</p>
            <p className="mt-1 text-[14px] font-bold">{weather.wind} km/h</p>
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground">Feels Like</p>
            <p className="mt-1 text-[14px] font-bold">{weather.feelsLike}°C</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Info */}
      <motion.div
        className="rounded-2xl border border-border bg-card p-5 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-[18px] font-bold">Quick Info</h2>
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
                <p className="text-[14px] font-bold">{info.label}</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">{info.value}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </aside>
  );
}