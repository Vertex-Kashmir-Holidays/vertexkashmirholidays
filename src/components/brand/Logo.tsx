// src/components/ui/Logo.tsx
'use client';

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoVariant = "light" | "dark" | "auto";

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  href?: string;
}

export function Logo({
  variant = "auto",
  className,
  href = "/",
}: LogoProps) {
  // Define colors based on variant
  const isLight = variant === "light";
  const isDark = variant === "dark";
  
  // For auto mode, we use CSS classes to handle dark/light mode
  const textColor = isLight 
    ? "text-white" 
    : isDark 
      ? "text-navy-brand" 
      : "text-white dark:text-navy-brand";
  
  const subTextColor = isLight
    ? "text-green-glow"
    : isDark
      ? "text-green-brand"
      : "text-green-glow dark:text-green-brand";

  const logoContent = (
    <div className="flex items-center gap-2.5">
      {/* Icon - same for all variants */}
      <div className="grid h-8 w-8 place-items-center rounded-md bg-white text-white shadow-glow ring-inner">
        <Image
          src="/brand/icon.png"
          alt="V"
          width={40}
          height={40}
          className="object-contain"
        />
      </div>
      
      {/* Text */}
      <div className="leading-none">
        <span className={`block font-display text-[16px] font-extrabold ${textColor}`}>
          Vertex Kashmir
        </span>
        <span className={`block text-center mt-1 text-[8px] font-bold tracking-[0.4em] ${subTextColor}`}>
          HOLIDAYS
        </span>
      </div>
    </div>
  );

  if (!href) return logoContent;

  return (
    <Link
      href={href}
      aria-label="Vertex Kashmir Holidays"
      className="inline-flex items-center"
    >
      {logoContent}
    </Link>
  );
}