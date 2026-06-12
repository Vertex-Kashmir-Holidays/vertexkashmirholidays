"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { HeroParallax } from "./HeroParallax";

const HeroR3F = dynamic(() => import("./HeroR3F").then((m) => ({ default: m.HeroR3F })), {
  ssr: false,
  loading: () => <HeroParallax />,
});

const HeroSpline = dynamic(() => import("./HeroSpline").then((m) => ({ default: m.HeroSpline })), {
  ssr: false,
  loading: () => <HeroParallax />,
});

type HeroMode = "parallax" | "r3f" | "spline";

type NavWithConnection = Navigator & {
  connection?: { effectiveType?: string; saveData?: boolean };
};

function getEffectiveMode(desired: HeroMode): HeroMode {
  if (typeof window === "undefined") return "parallax";
  // Honour accessibility preference
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "parallax";
  // Mobile screens skip heavy WebGL scenes
  if (window.innerWidth < 768) return "parallax";
  // Slow / data-saver connections
  const conn = (navigator as NavWithConnection).connection;
  if (conn?.saveData) return "parallax";
  if (conn?.effectiveType && ["slow-2g", "2g"].includes(conn.effectiveType)) return "parallax";
  return desired;
}

export function Hero() {
  const desired = (process.env.NEXT_PUBLIC_HERO_MODE ?? "parallax") as HeroMode;
  // Always start with parallax to prevent SSR/client mismatch
  const [mode, setMode] = useState<HeroMode>("parallax");

  useEffect(() => {
    setMode(getEffectiveMode(desired));
  }, [desired]);

  if (mode === "r3f") return <HeroR3F />;
  if (mode === "spline") return <HeroSpline />;
  return <HeroParallax />;
}
