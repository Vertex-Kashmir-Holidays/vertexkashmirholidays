// src/components/sections/DestinationsFilterBar.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

interface DestinationsFilterBarProps {
  onFilterChange: (chip: string, search: string) => void;
}

export function DestinationsFilterBar({ onFilterChange }: DestinationsFilterBarProps) {
  const [activeChip, setActiveChip] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Each chip matches a destination's exact region or name (DestinationsBrowser).
  const chips = ["All", "Kashmir Valley", "Gulmarg", "Pahalgam", "Sonamarg", "Ladakh"];

  const handleChipClick = (chip: string) => {
    setActiveChip(chip);
    onFilterChange(chip, searchQuery);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onFilterChange(activeChip, value);
  };

  return (
    <section className="relative z-10 -mt-7 rounded-t-[28px] bg-background pt-8">
      <div className="mx-auto flex max-w-[1300px] flex-col gap-3 px-6 sm:flex-row sm:items-center">
        {/* Search */}
        <label className="flex w-full items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2.5 shadow-soft sm:max-w-[235px]">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
          <input
            value={searchQuery}
            onChange={handleSearch}
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
            placeholder="Search destinations..."
          />
        </label>

        {/* Chips */}
        <div className="scrollbar-none flex flex-1 gap-2 overflow-x-auto">
          {chips.map((chip, i) => (
            <motion.button
              key={i}
              onClick={() => handleChipClick(chip)}
              className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-semibold shadow-soft transition ${
                activeChip === chip
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground/80 hover:border-primary hover:text-primary"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {chip}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
