// src/components/sections/TourDetailsTabs.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/organisms/tabs";
import { Container } from "@/components/ui/layout/Container";

interface TourDetailsTabsProps {
  sections: {
    id: string;
    label: string;
  }[];
}

export function TourDetailsTabs({ sections }: TourDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState(sections[0].id);

  // Combined height of the fixed navbar + this sticky tabs bar, so the
  // scroll-spy threshold and scroll-to target both clear the same overlap.
  const STICKY_OFFSET = 160;

  useEffect(() => {
    const handleScroll = () => {
      // Scroll spy - find which section is in view
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
    <div className="sticky top-24 z-40 border-b border-border bg-card shadow-sm">
      <Container>
        <Tabs value={activeTab} onValueChange={scrollToSection}>
          <TabsList className="py-3">
            {sections.map((section) => (
              <TabsTrigger key={section.id} value={section.id} asChild>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  {section.label}
                  {activeTab === section.id && (
                    <motion.span
                      className="absolute inset-x-0 -bottom-[1px] h-[2.5px] rounded-full bg-primary"
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
