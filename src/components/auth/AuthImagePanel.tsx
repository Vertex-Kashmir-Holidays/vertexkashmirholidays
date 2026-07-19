// src/components/sections/AuthImagePanel.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { EASE_BRAND } from "@/lib/motion";
import { useState, useEffect } from "react";
import { Clock, Star } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

interface AuthImagePanelProps {
  view: "login" | "register";
}

export function AuthImagePanel({ view }: AuthImagePanelProps) {
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const testimonials = [
    {
      quote: '"Vertex Kashmir made our honeymoon absolutely magical. Every detail was perfect!"',
      author: "– Arav & Meera, Bangalore",
    },
    {
      quote: '"Booked for my parents — the team handled everything like family. Flawless trip."',
      author: "– Rohit S., Pune",
    },
    {
      quote: '"Gondola tickets, houseboat, snow day — all sorted before we even landed."',
      author: "– Sana & Imran, Hyderabad",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <aside className="relative hidden min-h-[760px] overflow-hidden lg:block">
      <motion.img
        src="/hero/shikara-lg.webp"
        alt="Shikara on Dal Lake, Srinagar, Kashmir"
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: EASE_BRAND }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/55 via-brand-dark/25 to-brand-dark/80"></div>

      <div className="relative flex h-full flex-col p-9">
        {/* Logo */}
        <Logo variant="light" href="/" />

        {/* Headline */}
        <div className="mt-16 max-w-xs">
          <AnimatePresence mode="wait">
            <motion.p
              key={view}
              className="text-[14px] font-bold text-emerald-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {view === "login" ? "Welcome back!" : "Join our family"}
            </motion.p>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.h1
              key={view}
              className="mt-3 font-display text-[38px] font-bold leading-[1.18] text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {view === "login"
                ? "Let's continue your Kashmir journey"
                : "Let's start your Kashmir adventure"}
            </motion.h1>
          </AnimatePresence>
          <p className="mt-5 text-[16px] leading-relaxed text-white/85">
            Handcrafted trips. Honest pricing.
            <br />
            Unforgettable memories.
          </p>
        </div>

        <div className="mt-auto">
          {/* Stats */}
          <div className="flex flex-wrap gap-x-8 gap-y-4 text-white">
            <div>
              <p className="text-[18px] font-extrabold leading-tight">15+</p>
              <p className="text-[12px] text-white/70">Years on ground</p>
            </div>
            <div>
              <p className="text-[18px] font-extrabold leading-tight">12,000+</p>
              <p className="text-[12px] text-white/70">Happy travellers</p>
            </div>
            <div>
              <p className="text-[18px] font-extrabold leading-tight">4.9/5</p>
              <p className="text-[12px] text-white/70">Average rating</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[18px] font-extrabold leading-tight">
                <Clock className="h-4 w-4" strokeWidth={2} />
                24×7
              </p>
              <p className="text-[12px] text-white/70">WhatsApp support</p>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-6 rounded-2xl bg-brand-dark/75 p-5 backdrop-blur">
            <p className="flex gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star key={s} className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
              ))}
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={testimonialIndex}
                className="mt-2.5 text-[14px] leading-relaxed text-white/90"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {testimonials[testimonialIndex].quote}
              </motion.p>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.p
                key={testimonialIndex}
                className="mt-2.5 text-[14px] font-semibold text-white/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {testimonials[testimonialIndex].author}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="mt-4 flex justify-center gap-1.5">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonialIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === testimonialIndex ? "w-4 bg-white" : "w-1.5 bg-white/40"
                }`}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>

          <p className="mt-6 text-[12px] text-white/55">
            © {new Date().getFullYear()} Vertex Kashmir Holidays, operated by Vertex Kashmir Tour &
            Travels. All rights reserved.
          </p>
        </div>
      </div>
    </aside>
  );
}
