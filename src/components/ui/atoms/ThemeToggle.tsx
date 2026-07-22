"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Circle, Sun, Moon } from "lucide-react";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes can only resolve the active theme on the client; wait for mount
  // to avoid a hydration mismatch between server and client markup.
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={
        mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle color theme"
      }
      // title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={className}
    >
      {/* Render a neutral icon until mounted to keep SSR/CSR markup stable */}
      {!mounted ? (
        <Circle className="h-4 w-4" strokeWidth={2} />
      ) : isDark ? (
        // Sun — click to go light
        <Sun className="h-4 w-4" strokeWidth={2} />
      ) : (
        // Moon — click to go dark
        <Moon className="h-4 w-4" fill="currentColor" strokeWidth={2} />
      )}
    </button>
  );
}
