// src/components/sections/TourDetailsTabs.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TourDetailsTabsProps {
  sections: {
    id: string;
    label: string;
  }[];
}

export function TourDetailsTabs({ sections }: TourDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState(sections[0].id);

  useEffect(() => {
    const handleScroll = () => {
      // Scroll spy - find which section is in view
      const sectionElements = sections.map((s) => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 100;

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
    <div className="border-b border-brand-line bg-white">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="scrollbar-none flex gap-7 overflow-x-auto py-3 text-[14px] font-semibold text-brand-mute">
          {sections.map((section) => (
            <motion.button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`relative whitespace-nowrap pb-1 transition-colors ${
                activeTab === section.id
                  ? 'text-brand-green2'
                  : 'hover:text-brand-ink'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {section.label}
              {activeTab === section.id && (
                <motion.span
                  className="absolute inset-x-0 -bottom-[1px] h-[2.5px] rounded-full bg-brand-bright"
                  layoutId="activeTab"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}