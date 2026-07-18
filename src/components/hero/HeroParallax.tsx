"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Flame, Snowflake } from "lucide-react";
import { HeroContent } from "./HeroContent";

// ─── Main hero ────────────────────────────────────────────────────────────────
export function HeroParallax() {
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 55, damping: 22 });
  const springY = useSpring(mouseY, { stiffness: 55, damping: 22 });

  // Slow deep-background layer
  const bgX = useTransform(springX, [0, 1], [-20, 20]);
  const bgY = useTransform(springY, [0, 1], [-10, 10]);
  // Fast mid-layer
  const midX = useTransform(springX, [0, 1], [-40, 40]);
  const midY = useTransform(springY, [0, 1], [-20, 20]);
  // Subtle card tilt
  const cardX = useTransform(springX, [0, 1], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };
  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen flex flex-col overflow-hidden bg-brand-navy"
      aria-label="Hero — Kashmir holiday promotion"
    >
      {/* ── PARALLAX BACKGROUND LAYERS ────────────────────────────────── */}

      {/* Deep layer: heat left + Kashmir right */}
      <motion.div
        style={{ x: bgX, y: bgY }}
        className="absolute inset-0 pointer-events-none will-change-transform"
        aria-hidden
      >
        {/* Burning plains — left half */}
        <div className="absolute left-0 top-0 w-1/2 h-full bg-gradient-to-r from-[#2d0900] via-[#4a1800]/80 to-transparent" />
        {/* Kashmir sky — right half */}
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#001a2e] via-[#002e50]/80 to-transparent" />
      </motion.div>

      {/* Mid layer: sun orb + mountain silhouette */}
      <motion.div
        style={{ x: midX, y: midY }}
        className="absolute inset-0 pointer-events-none will-change-transform"
        aria-hidden
      >
        {/* Sun glow (plains) */}
        <div
          className="absolute left-[8%] top-[18%] w-72 h-72 rounded-full blur-3xl opacity-60"
          style={{
            background:
              "radial-gradient(circle, rgba(255,120,30,0.7), rgba(255,60,0,0.3), transparent 70%)",
          }}
        />
        <div
          className="absolute left-[14%] top-[24%] w-32 h-32 rounded-full blur-xl"
          style={{
            background:
              "radial-gradient(circle, rgba(255,200,80,0.9), rgba(255,140,0,0.6), transparent 60%)",
          }}
        />
        {/* Heat shimmer lines */}
        <div className="absolute left-[5%] bottom-[15%] w-[35%] h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
        <div className="absolute left-[8%] bottom-[20%] w-[28%] h-px bg-gradient-to-r from-transparent via-gold/15 to-transparent" />

        {/* Kashmir mountain silhouette */}
        <div className="absolute right-0 bottom-0 w-[52%] h-[70%]">
          <svg
            viewBox="0 0 640 420"
            className="w-full h-full"
            preserveAspectRatio="xMaxYMax meet"
            aria-hidden
          >
            <defs>
              <linearGradient id="mt-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#deeef8" stopOpacity="0.9" />
                <stop offset="35%" stopColor="#a8cfe0" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#1b4e70" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            {/* Mountain range */}
            <polygon
              points="0,420 60,260 130,320 200,160 280,240 360,90 430,200 500,130 570,210 640,170 640,420"
              fill="url(#mt-grad)"
              opacity="0.55"
            />
            {/* Snow caps */}
            <polygon points="200,160 230,200 170,205" fill="white" opacity="0.82" />
            <polygon points="360,90 398,140 322,148" fill="white" opacity="0.88" />
            <polygon points="500,130 528,168 472,172" fill="white" opacity="0.78" />
          </svg>
        </div>

        {/* Kashmir sky glow */}
        <div
          className="absolute right-[12%] top-[8%] w-96 h-96 rounded-full blur-3xl opacity-25"
          style={{ background: "radial-gradient(circle, hsl(199 89% 48%), transparent 70%)" }}
        />
      </motion.div>

      {/* Portal ring (slowest layer — least depth) */}
      <motion.div
        style={{ x: bgX, y: bgY }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden
      >
        <div className="relative w-80 h-80 lg:w-[420px] lg:h-[420px] -mt-16">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border border-brand-green/20" />
          {/* Inner ring */}
          <div className="absolute inset-5 rounded-full border border-brand-green/15" />
          {/* Glow core */}
          <div
            className="absolute inset-10 rounded-full blur-2xl opacity-40"
            style={{
              background: "radial-gradient(circle, hsl(158 64% 28% / 0.6), transparent 70%)",
            }}
          />
          {/* Temperature labels — desktop only */}
          <div className="hidden lg:flex absolute -left-36 top-1/2 -translate-y-1/2 flex-col items-center gap-1">
            <Flame className="h-5 w-5 text-gold" />
            <p className="text-gold font-bold text-2xl font-mono leading-none">46°C</p>
            <p className="text-white/35 text-[12px] uppercase tracking-widest">Delhi Plains</p>
          </div>
          <div className="hidden lg:flex absolute -right-36 top-1/2 -translate-y-1/2 flex-col items-center gap-1">
            <Snowflake className="h-5 w-5 text-link" />
            <p className="text-link font-bold text-2xl font-mono leading-none">18°C</p>
            <p className="text-white/35 text-[12px] uppercase tracking-widest">Kashmir</p>
          </div>
        </div>
      </motion.div>

      {/* Readability overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.35), transparent 45%, rgba(0,0,0,0.55))",
        }}
        aria-hidden
      />

      <HeroContent cardTilt={cardX} />
    </section>
  );
}
