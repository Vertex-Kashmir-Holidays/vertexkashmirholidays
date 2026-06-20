// src/components/brand/Logo.tsx
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

// Brand-kit horizontal lockups. Note the kit naming is by *background*:
//   horizontal-light.svg → navy wordmark, for LIGHT surfaces
//   horizontal-dark.svg  → white wordmark, for DARK surfaces / photos
// This component's `variant` is by *desired text colour* (its historical API):
//   variant="dark"  → navy wordmark (use on light surfaces)
//   variant="light" → white wordmark (use on dark surfaces / hero photos)
//   variant="auto"  → follows the active theme (navy in light, white in dark)
const NAVY_LOCKUP = "/brand/kit/svg/vertex-logo-horizontal-light.svg";
const WHITE_LOCKUP = "/brand/kit/svg/vertex-logo-horizontal-dark.svg";

export function Logo({ variant = "auto", className, href = "/" }: LogoProps) {
  const img = (src: string, extra?: string) => (
    <Image
      src={src}
      alt="Vertex Kashmir Holidays"
      width={168}
      height={54}
      priority
      className={cn("h-8 w-auto select-none object-contain", extra)}
    />
  );

  const content =
    variant === "light" ? (
      img(WHITE_LOCKUP)
    ) : variant === "dark" ? (
      img(NAVY_LOCKUP)
    ) : (
      <>
        {img(NAVY_LOCKUP, "block dark:hidden")}
        {img(WHITE_LOCKUP, "hidden dark:block")}
      </>
    );

  if (!href) {
    return <span className={cn("inline-flex items-center", className)}>{content}</span>;
  }

  return (
    <Link
      href={href}
      aria-label="Vertex Kashmir Holidays"
      className={cn("inline-flex items-center", className)}
    >
      {content}
    </Link>
  );
}
