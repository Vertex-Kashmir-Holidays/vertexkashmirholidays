// src/components/sections/DestinationDetailTabs.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/organisms/tabs";
import { Container } from "@/components/ui/layout/Container";

interface DestinationDetailTabsProps {
  sections: {
    id: string;
    label: string;
    icon: string;
  }[];
}

export function DestinationDetailTabs({ sections }: DestinationDetailTabsProps) {
  const [activeTab, setActiveTab] = useState(sections[0].id);

  // Combined height of the fixed navbar + this sticky tabs bar, so the
  // scroll-spy threshold and scroll-to target both clear the same overlap.
  const STICKY_OFFSET = 160;

  useEffect(() => {
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

  return (
    <div className="sticky top-24 z-40 -mt-10 shadow-sm">
      <Container>
        <Tabs value={activeTab} onValueChange={scrollToSection}>
          <TabsList
            aria-label="Destination sections"
            className="w-fit max-w-full gap-2 rounded-t-2xl bg-card px-4 pt-3 shadow-soft"
          >
            {sections.map((section) => (
              <TabsTrigger key={section.id} value={section.id} asChild>
                <motion.button
                  className="flex shrink-0 items-center gap-2 px-3 pb-3 pt-1 text-[14px] text-foreground/70 transition hover:text-foreground data-[state=active]:text-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={section.icon} />
                  </svg>
                  {section.label}
                  {activeTab === section.id && (
                    <motion.span
                      className="absolute inset-x-3 bottom-0 h-[2.5px] rounded-full bg-primary"
                      layoutId="activeTab"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </Container>
    </div>
  );
}
