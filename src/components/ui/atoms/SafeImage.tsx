"use client";

import { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { imgSrc, PLACEHOLDER_IMAGE } from "@/lib/placeholder";

type SafeImageProps = Omit<ImageProps, "src"> & { src?: string | null };

// Falls back to the branded placeholder both for a missing src (via imgSrc,
// the null/empty case) and for a src that fails to load at runtime — a
// dead/404 URL, which imgSrc() alone can't catch since it only checks for a
// non-empty string.
export function SafeImage({ src, alt, ...props }: SafeImageProps) {
  const resolved = imgSrc(src);
  const [current, setCurrent] = useState(resolved);

  useEffect(() => setCurrent(resolved), [resolved]);

  return (
    <Image
      {...props}
      src={current}
      alt={alt}
      onError={() => {
        if (current !== PLACEHOLDER_IMAGE) setCurrent(PLACEHOLDER_IMAGE);
      }}
    />
  );
}
