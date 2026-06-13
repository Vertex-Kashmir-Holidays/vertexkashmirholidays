// src/components/sections/DestinationDetailTabs.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DestinationDetailTabsProps {
  sections: {
    id: string;
    label: string;
    icon: string;
  }[];
}

export function DestinationDetailTabs({ sections }: DestinationDetailTabsProps) {
  const [activeTab, setActiveTab] = useState(sections[0].id);

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map((s) => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 150;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el && el.offsetTop <= scrollPosition) {
          setActiveTab(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top, behavior: 'smooth' });
      setActiveTab(id);
    }
  };

  return (
    <div className="relative z-20 -mt-10">
      <div className="mx-auto max-w-[1300px] px-6">
        <nav
          className="scrollbar-none flex w-fit max-w-full gap-2 overflow-x-auto rounded-t-2xl bg-card px-4 pt-3 shadow-soft"
          aria-label="Destination sections"
        >
          {sections.map((section) => (
            <motion.button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`relative flex shrink-0 items-center gap-2 px-3 pb-3 pt-1 text-[13px] font-semibold ${
                activeTab === section.id
                  ? 'text-primary'
                  : 'text-foreground/70 transition hover:text-foreground'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d={section.icon} />
              </svg>
              {section.label}
              {activeTab === section.id && (
                <motion.span
                  className="absolute inset-x-3 bottom-0 h-[2.5px] rounded-full bg-primary"
                  layoutId="activeTab"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </nav>
      </div>
    </div>
  );
}