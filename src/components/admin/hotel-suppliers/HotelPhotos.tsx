"use client";

// A hotel's main + 2 room photos: a small thumbnail for the Hotel Rates list
// (`variant="thumb"`) or a 3-up strip for the hotel page (`variant="strip"`).
// Clicking any photo opens all of them large in the shared GalleryLightbox.
import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { GalleryLightbox } from "@/components/ui/organisms/GalleryLightbox";

interface HotelPhotosProps {
  hotelName: string;
  coverImageUrl: string | null;
  roomImageUrl: string | null;
  roomImage2Url: string | null;
  variant: "thumb" | "strip";
}

export function HotelPhotos({
  hotelName,
  coverImageUrl,
  roomImageUrl,
  roomImage2Url,
  variant,
}: HotelPhotosProps) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const photos = [
    { src: coverImageUrl, label: "Main" },
    { src: roomImageUrl, label: "Room" },
    { src: roomImage2Url, label: "Room 2" },
  ].flatMap((p) => (p.src ? [{ src: p.src, label: p.label, alt: `${hotelName} — ${p.label}` }] : []));

  const lightbox = (
    <GalleryLightbox
      images={photos}
      initialIndex={openAt ?? 0}
      open={openAt !== null}
      onClose={() => setOpenAt(null)}
    />
  );

  if (variant === "thumb") {
    if (photos.length === 0) {
      return (
        <span className="flex h-11 w-16 items-center justify-center rounded-md bg-muted text-muted-foreground/50">
          <ImageOff className="h-4 w-4" />
        </span>
      );
    }
    // stopPropagation on the wrapper: the row navigates on click, and React
    // bubbles lightbox (portal) clicks up through this tree too.
    return (
      <span onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setOpenAt(0)}
          className="relative block h-11 w-16 overflow-hidden rounded-md ring-1 ring-border hover:ring-primary"
          aria-label={`View ${hotelName} photos`}
        >
          <Image src={photos[0].src} alt={photos[0].alt} fill sizes="64px" className="object-cover" />
        </button>
        {lightbox}
      </span>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <p className="mb-3 text-sm font-bold text-foreground">Photos</p>
      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No photos yet — add them from Edit.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {photos.map((p, i) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setOpenAt(i)}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-border hover:ring-primary"
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                {p.label}
              </span>
            </button>
          ))}
        </div>
      )}
      {lightbox}
    </section>
  );
}
