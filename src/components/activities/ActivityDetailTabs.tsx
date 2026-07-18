// src/components/activities/ActivityDetailTabs.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ActivityDetailTabsProps {
  sections: {
    id: string;
    label: string;
  }[];
}

// Same sticky-below-navbar tabs bar as TourDetailsTabs / DestinationDetailTabs.
export function ActivityDetailTabs({ sections }: ActivityDetailTabsProps) {
  const [activeTab, setActiveTab] = useState(sections[0]?.id ?? "");

  // Combined height of the fixed navbar + this sticky tabs bar, so the
  // scroll-spy threshold and scroll-to target both clear the same overlap.
  const STICKY_OFFSET = 160;

  useEffect(() => {
    if (sections.length === 0) return;

    const handleScroll = () => {
      const sectionElements = sections.map((s) => document.getElementById(s.id));
      const scrollPosition = window.scrollY + STICKY_OFFSET;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el && el.offsetTop <= scrollPosition) {
          setActiveTab(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET;
      window.scrollTo({ top, behavior: "smooth" });
      setActiveTab(id);
    }
  };

  if (sections.length === 0) return null;

  return (
    <div className="sticky top-24 z-40 border-b border-border bg-card shadow-sm">
      <div className="mx-auto max-w-[1300px] px-6">
        <div className="scrollbar-none flex gap-7 overflow-x-auto py-3 text-[16px] font-semibold text-muted-foreground">
          {sections.map((section) => (
            <motion.button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`relative whitespace-nowrap pb-1 transition-colors ${
                activeTab === section.id ? "text-primary" : "hover:text-foreground"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {section.label}
              {activeTab === section.id && (
                <motion.span
                  className="absolute inset-x-0 -bottom-[1px] h-[2.5px] rounded-full bg-primary"
                  layoutId="activeActivityTab"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
