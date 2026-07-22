// src/components/campaign/CampaignNav.tsx
"use client";

import { motion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/atoms/ThemeToggle";
import { useEffect, useState } from "react";

interface CampaignNavProps {
  ctaText: string;
  phone: string | null;
}

// The campaign nav is fixed dark chrome in both themes — it overlays the dark
// hero at the top and gets its own dark backdrop once scrolled, so white text
// stays legible regardless of the site theme.
export function CampaignNav({ ctaText, phone }: CampaignNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <motion.nav
        className={`mx-auto flex max-w-[1300px] items-center justify-between rounded-2xl border px-5 pb-3 transition-colors duration-300 ${
          scrolled
            ? "border-white/10 bg-[hsl(202_50%_7%/0.88)] backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo variant="light" href="/" className="h-8 md:h-12" />
        <div className="flex items-center gap-3">
          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="hidden items-center gap-2 text-[14px] font-semibold text-white/80 transition hover:text-white md:flex"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 text-green-glow"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
              </svg>
              {phone}
            </a>
          )}
          <ThemeToggle className="grid h-9 w-9 place-items-center rounded-full border !border-white/20 !text-white hover:!bg-white/10" />
          <a
            href="#reserve"
            className="sweep rounded-full bg-accent-grad px-5 py-2.5 text-[14px] font-bold text-white ring-inner shadow-glow transition hover:scale-[1.03]"
          >
            {ctaText}
          </a>
        </div>
      </motion.nav>
    </header>
  );
}
